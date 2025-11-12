-- FASE 1: Estrutura de Datas Dual (Real vs Registro)

-- Adicionar campos de data real aos assets
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS effective_registration_date DATE,
ADD COLUMN IF NOT EXISTS retroactive_registration_notes TEXT;

COMMENT ON COLUMN public.assets.effective_registration_date IS 'Data real de entrada do equipamento (pode ser retroativa)';
COMMENT ON COLUMN public.assets.retroactive_registration_notes IS 'Justificativa para cadastro retroativo';

-- Adicionar campos de data real às manutenções
ALTER TABLE public.asset_maintenances 
ADD COLUMN IF NOT EXISTS effective_maintenance_date DATE;

COMMENT ON COLUMN public.asset_maintenances.effective_maintenance_date IS 'Data real da manutenção (pode diferir de maintenance_date para casos retroativos)';

-- Adicionar campos ao histórico para marcação retroativa
ALTER TABLE public.patrimonio_historico 
ADD COLUMN IF NOT EXISTS data_evento_real TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registro_retroativo BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.patrimonio_historico.data_evento_real IS 'Data real do evento (null = usar data_modificacao)';
COMMENT ON COLUMN public.patrimonio_historico.registro_retroativo IS 'Indica se foi registrado retroativamente';

-- Atualizar RPC para aceitar data real do evento
CREATE OR REPLACE FUNCTION public.registrar_evento_patrimonio(
  p_pat_id UUID,
  p_codigo_pat TEXT,
  p_tipo_evento TEXT,
  p_detalhes_evento TEXT,
  p_campo_alterado TEXT DEFAULT NULL,
  p_valor_antigo TEXT DEFAULT NULL,
  p_valor_novo TEXT DEFAULT NULL,
  p_data_evento_real TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name TEXT;
  v_historico_id UUID;
  v_is_retroactive BOOLEAN := false;
BEGIN
  -- Buscar nome do usuário
  SELECT full_name INTO v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  -- Determinar se é retroativo (>7 dias atrás)
  IF p_data_evento_real IS NOT NULL THEN
    v_is_retroactive := (p_data_evento_real < NOW() - INTERVAL '7 days');
  END IF;

  -- Inserir no histórico
  INSERT INTO public.patrimonio_historico (
    pat_id,
    codigo_pat,
    tipo_evento,
    detalhes_evento,
    campo_alterado,
    valor_antigo,
    valor_novo,
    usuario_modificacao,
    usuario_nome,
    data_evento_real,
    registro_retroativo,
    data_modificacao
  ) VALUES (
    p_pat_id,
    p_codigo_pat,
    p_tipo_evento,
    p_detalhes_evento,
    p_campo_alterado,
    p_valor_antigo,
    p_valor_novo,
    auth.uid(),
    v_user_name,
    p_data_evento_real,
    v_is_retroactive,
    COALESCE(p_data_evento_real, NOW())
  )
  RETURNING historico_id INTO v_historico_id;

  RETURN v_historico_id;
END;
$$;

-- FASE 5.1: Validações de Coerência Temporal

-- Função de validação para manutenções
CREATE OR REPLACE FUNCTION public.validate_maintenance_retroactive_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset_entry_date DATE;
BEGIN
  -- Buscar data de entrada do equipamento
  SELECT COALESCE(effective_registration_date, created_at::DATE) 
  INTO v_asset_entry_date
  FROM public.assets 
  WHERE id = NEW.asset_id;

  -- Validar que manutenção não é anterior à entrada do equipamento
  IF NEW.maintenance_date < v_asset_entry_date THEN
    RAISE EXCEPTION 'Data da manutenção (%) não pode ser anterior à entrada do equipamento (%)', 
      NEW.maintenance_date, 
      v_asset_entry_date;
  END IF;

  -- Se tem effective_maintenance_date, validar também
  IF NEW.effective_maintenance_date IS NOT NULL THEN
    IF NEW.effective_maintenance_date < v_asset_entry_date THEN
      RAISE EXCEPTION 'Data efetiva da manutenção (%) não pode ser anterior à entrada do equipamento (%)', 
        NEW.effective_maintenance_date, 
        v_asset_entry_date;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger de validação
DROP TRIGGER IF EXISTS check_maintenance_retroactive_dates ON public.asset_maintenances;
CREATE TRIGGER check_maintenance_retroactive_dates
  BEFORE INSERT OR UPDATE ON public.asset_maintenances
  FOR EACH ROW 
  EXECUTE FUNCTION public.validate_maintenance_retroactive_dates();

-- Função para validar movimentações retroativas
CREATE OR REPLACE FUNCTION public.validate_asset_movement_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset_entry_date DATE;
BEGIN
  -- Buscar data de entrada do equipamento
  SELECT COALESCE(effective_registration_date, created_at::DATE) 
  INTO v_asset_entry_date
  FROM public.assets 
  WHERE id = NEW.id;

  -- Validar movimentações
  IF NEW.rental_start_date IS NOT NULL AND NEW.rental_start_date < v_asset_entry_date THEN
    RAISE EXCEPTION 'Data de início de locação (%) não pode ser anterior à entrada do equipamento (%)', 
      NEW.rental_start_date, 
      v_asset_entry_date;
  END IF;

  IF NEW.maintenance_arrival_date IS NOT NULL AND NEW.maintenance_arrival_date < v_asset_entry_date THEN
    RAISE EXCEPTION 'Data de entrada em manutenção (%) não pode ser anterior à entrada do equipamento (%)', 
      NEW.maintenance_arrival_date, 
      v_asset_entry_date;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger de validação para movimentações
DROP TRIGGER IF EXISTS check_asset_movement_dates ON public.assets;
CREATE TRIGGER check_asset_movement_dates
  BEFORE INSERT OR UPDATE ON public.assets
  FOR EACH ROW 
  EXECUTE FUNCTION public.validate_asset_movement_dates();