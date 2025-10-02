-- Criar tabela de histórico de patrimônio
CREATE TABLE IF NOT EXISTS public.patrimonio_historico (
  historico_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pat_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  codigo_pat TEXT NOT NULL,
  campo_alterado TEXT NOT NULL,
  valor_antigo TEXT,
  valor_novo TEXT,
  usuario_modificacao UUID REFERENCES auth.users(id),
  usuario_nome TEXT,
  data_modificacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_patrimonio_historico_pat_id ON public.patrimonio_historico(pat_id);
CREATE INDEX idx_patrimonio_historico_codigo_pat ON public.patrimonio_historico(codigo_pat);
CREATE INDEX idx_patrimonio_historico_data ON public.patrimonio_historico(data_modificacao DESC);
CREATE INDEX idx_patrimonio_historico_usuario ON public.patrimonio_historico(usuario_modificacao);

-- Habilitar RLS
ALTER TABLE public.patrimonio_historico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários autenticados podem visualizar histórico"
ON public.patrimonio_historico
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Sistema pode inserir no histórico"
ON public.patrimonio_historico
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Função para registrar alterações no histórico
CREATE OR REPLACE FUNCTION public.log_asset_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  -- Buscar nome do usuário
  SELECT full_name INTO v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  -- Registrar cada campo alterado
  IF OLD.equipment_name IS DISTINCT FROM NEW.equipment_name THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'Nome do Equipamento', 
      OLD.equipment_name, NEW.equipment_name, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.location_type IS DISTINCT FROM NEW.location_type THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'Local do Equipamento', 
      OLD.location_type, NEW.location_type, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.rental_company IS DISTINCT FROM NEW.rental_company THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'Empresa de Locação', 
      OLD.rental_company, NEW.rental_company, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.rental_work_site IS DISTINCT FROM NEW.rental_work_site THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'Obra de Locação', 
      OLD.rental_work_site, NEW.rental_work_site, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.rental_start_date IS DISTINCT FROM NEW.rental_start_date THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'Data Início Locação', 
      OLD.rental_start_date::TEXT, NEW.rental_start_date::TEXT, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.rental_end_date IS DISTINCT FROM NEW.rental_end_date THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'Data Fim Locação', 
      OLD.rental_end_date::TEXT, NEW.rental_end_date::TEXT, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.deposito_description IS DISTINCT FROM NEW.deposito_description THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'Descrição Depósito', 
      OLD.deposito_description, NEW.deposito_description, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.maintenance_company IS DISTINCT FROM NEW.maintenance_company THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'Empresa de Manutenção', 
      OLD.maintenance_company, NEW.maintenance_company, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.maintenance_work_site IS DISTINCT FROM NEW.maintenance_work_site THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'Obra de Manutenção', 
      OLD.maintenance_work_site, NEW.maintenance_work_site, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.maintenance_description IS DISTINCT FROM NEW.maintenance_description THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'Descrição Manutenção', 
      OLD.maintenance_description, NEW.maintenance_description, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.equipment_observations IS DISTINCT FROM NEW.equipment_observations THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'Observações', 
      OLD.equipment_observations, NEW.equipment_observations, auth.uid(), v_user_name
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger para assets
DROP TRIGGER IF EXISTS track_asset_changes ON public.assets;
CREATE TRIGGER track_asset_changes
AFTER UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.log_asset_changes();