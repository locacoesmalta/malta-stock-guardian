-- ============================================
-- TABELA DE SERVIÇOS EXTERNOS EM RELATÓRIOS
-- ============================================
-- Segue princípios:
-- - architecture/pat-as-central-entity: Vinculado via report → PAT
-- - principles/full-traceability-required: created_by, created_at, report_id

CREATE TABLE IF NOT EXISTS public.report_external_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  service_description TEXT NOT NULL CHECK (char_length(service_description) > 0 AND char_length(service_description) <= 500),
  service_value NUMERIC(10,2) NOT NULL CHECK (service_value > 0),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_report_external_services_report_id 
  ON public.report_external_services(report_id);

CREATE INDEX IF NOT EXISTS idx_report_external_services_created_by 
  ON public.report_external_services(created_by);

-- Comentários de documentação
COMMENT ON TABLE public.report_external_services IS 
  'Armazena serviços externos realizados em equipamentos e registrados em relatórios. Rastreável por PAT via reports.equipment_code';

COMMENT ON COLUMN public.report_external_services.service_description IS 
  'Descrição do serviço externo realizado (ex: soldagem, pintura, reparo). Máximo 500 caracteres.';

COMMENT ON COLUMN public.report_external_services.service_value IS 
  'Valor cobrado pelo serviço externo em reais (R$)';

-- ============================================
-- RLS POLICIES (seguindo padrão do sistema)
-- ============================================

ALTER TABLE public.report_external_services ENABLE ROW LEVEL SECURITY;

-- Policy de SELECT: Usuários com permissão de ver relatórios podem ver serviços
CREATE POLICY "Users with reports permission can view external services"
  ON public.report_external_services
  FOR SELECT
  TO authenticated
  USING (
    can_user_view_reports(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM public.reports 
      WHERE reports.id = report_external_services.report_id
        AND reports.deleted_at IS NULL
    )
  );

-- Policy de INSERT: Usuários que podem criar relatórios podem adicionar serviços
CREATE POLICY "Users with reports permission can create external services"
  ON public.report_external_services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    can_user_create_reports(auth.uid())
    AND auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.reports 
      WHERE reports.id = report_external_services.report_id
        AND (reports.created_by = auth.uid() OR can_user_edit_reports(auth.uid()))
        AND reports.deleted_at IS NULL
    )
  );

-- Policy de DELETE: Usuários que podem editar relatórios podem deletar serviços
CREATE POLICY "Users can delete external services"
  ON public.report_external_services
  FOR DELETE
  TO authenticated
  USING (
    can_user_edit_reports(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.reports 
      WHERE reports.id = report_external_services.report_id
        AND reports.deleted_at IS NULL
    )
  );

-- Policy de UPDATE: Usuários que podem editar relatórios podem atualizar serviços
CREATE POLICY "Users can update external services"
  ON public.report_external_services
  FOR UPDATE
  TO authenticated
  USING (
    can_user_edit_reports(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.reports 
      WHERE reports.id = report_external_services.report_id
        AND reports.deleted_at IS NULL
    )
  )
  WITH CHECK (
    can_user_edit_reports(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.reports 
      WHERE reports.id = report_external_services.report_id
        AND reports.deleted_at IS NULL
    )
  );

-- ============================================
-- ATUALIZAR FUNÇÃO TRANSACIONAL
-- ============================================
-- Adiciona suporte a serviços externos mantendo atomicidade

CREATE OR REPLACE FUNCTION public.create_report_with_parts(
  p_equipment_code TEXT,
  p_equipment_name TEXT,
  p_work_site TEXT,
  p_company TEXT,
  p_technician_name TEXT,
  p_report_date DATE,
  p_service_comments TEXT,
  p_considerations TEXT DEFAULT NULL,
  p_observations TEXT DEFAULT NULL,
  p_receiver TEXT DEFAULT NULL,
  p_responsible TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_parts JSONB DEFAULT '[]'::jsonb,
  p_external_services JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_report_id UUID;
  v_part JSONB;
  v_service JSONB;
  v_user_id UUID;
BEGIN
  -- Validar usuário
  v_user_id := COALESCE(p_created_by, auth.uid());
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Inserir relatório
  INSERT INTO public.reports (
    equipment_code,
    equipment_name,
    work_site,
    company,
    technician_name,
    report_date,
    service_comments,
    considerations,
    observations,
    receiver,
    responsible,
    created_by
  ) VALUES (
    p_equipment_code,
    p_equipment_name,
    p_work_site,
    p_company,
    p_technician_name,
    p_report_date,
    p_service_comments,
    p_considerations,
    p_observations,
    p_receiver,
    p_responsible,
    v_user_id
  ) RETURNING id INTO v_report_id;
  
  -- Inserir peças
  IF jsonb_array_length(p_parts) > 0 THEN
    FOR v_part IN SELECT * FROM jsonb_array_elements(p_parts)
    LOOP
      INSERT INTO public.report_parts (
        report_id,
        product_id,
        quantity_used,
        withdrawal_id
      ) VALUES (
        v_report_id,
        (v_part->>'product_id')::UUID,
        (v_part->>'quantity_used')::INTEGER,
        (v_part->>'withdrawal_id')::UUID
      );
      
      -- Marcar retirada como usada
      UPDATE public.material_withdrawals
      SET used_in_report_id = v_report_id
      WHERE id = (v_part->>'withdrawal_id')::UUID;
    END LOOP;
  END IF;
  
  -- Inserir serviços externos
  IF jsonb_array_length(p_external_services) > 0 THEN
    FOR v_service IN SELECT * FROM jsonb_array_elements(p_external_services)
    LOOP
      -- Validações
      IF (v_service->>'description') IS NULL OR char_length(v_service->>'description') = 0 THEN
        RAISE EXCEPTION 'Descrição do serviço externo não pode ser vazia';
      END IF;
      
      IF ((v_service->>'value')::NUMERIC) <= 0 THEN
        RAISE EXCEPTION 'Valor do serviço externo deve ser maior que zero';
      END IF;
      
      -- Inserir serviço com rastreabilidade completa
      INSERT INTO public.report_external_services (
        report_id,
        service_description,
        service_value,
        created_by
      ) VALUES (
        v_report_id,
        v_service->>'description',
        (v_service->>'value')::NUMERIC,
        v_user_id
      );
    END LOOP;
  END IF;
  
  -- Retornar ID do relatório criado
  RETURN v_report_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar relatório: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;