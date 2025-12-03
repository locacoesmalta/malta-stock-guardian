-- Tabela para Planos de Manutenção Preventiva/Corretiva
CREATE TABLE public.maintenance_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id),
  equipment_code TEXT, -- PAT manual caso não tenha no sistema
  equipment_name TEXT,
  equipment_manufacturer TEXT,
  equipment_model TEXT,
  equipment_serial TEXT,
  
  plan_type TEXT NOT NULL DEFAULT 'preventiva', -- preventiva, corretiva
  plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_hourmeter INTEGER DEFAULT 0,
  next_revision_hourmeter INTEGER,
  
  -- Dados da empresa (editáveis)
  company_name TEXT DEFAULT 'Malta Locações',
  company_cnpj TEXT DEFAULT '10.792.415/0001-14',
  company_address TEXT DEFAULT 'Rua Augusto Corrêa, 01 - Guamá, Belém - PA',
  company_cep TEXT DEFAULT '66075-110',
  company_phone TEXT DEFAULT '(91) 99628-0080',
  company_email TEXT DEFAULT 'contato@maltalocacoes.com.br',
  
  -- Cliente
  client_name TEXT,
  client_company TEXT,
  client_work_site TEXT,
  
  -- Observações (3 campos editáveis)
  observations_operational TEXT, -- Cuidados operacionais
  observations_technical TEXT,   -- Contatos assistência técnica
  observations_procedures TEXT,  -- Procedimentos
  
  -- Assinaturas
  supervisor_name TEXT,
  supervisor_signature TEXT,
  technician_name TEXT,
  technician_signature TEXT,
  client_signature TEXT,
  
  -- Itens de verificação (JSONB para flexibilidade total)
  verification_sections JSONB DEFAULT '[]'::jsonb,
  
  -- Fotos (JSONB array)
  photos JSONB DEFAULT '[]'::jsonb,
  
  -- Auditoria
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_maintenance_plans_asset_id ON public.maintenance_plans(asset_id);
CREATE INDEX idx_maintenance_plans_equipment_code ON public.maintenance_plans(equipment_code);
CREATE INDEX idx_maintenance_plans_plan_date ON public.maintenance_plans(plan_date);

-- Trigger para updated_at
CREATE TRIGGER update_maintenance_plans_updated_at
  BEFORE UPDATE ON public.maintenance_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.maintenance_plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users with permission can view maintenance plans"
  ON public.maintenance_plans FOR SELECT
  USING (can_user_access_assets(auth.uid()));

CREATE POLICY "Users with permission can create maintenance plans"
  ON public.maintenance_plans FOR INSERT
  WITH CHECK (can_user_edit_assets(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users with permission can update maintenance plans"
  ON public.maintenance_plans FOR UPDATE
  USING (can_user_edit_assets(auth.uid()));

CREATE POLICY "Users with permission can delete maintenance plans"
  ON public.maintenance_plans FOR DELETE
  USING (can_user_delete_assets(auth.uid()));