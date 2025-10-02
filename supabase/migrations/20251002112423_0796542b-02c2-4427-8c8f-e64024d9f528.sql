-- Adicionar novas colunas à tabela patrimonio_historico para suportar diferentes tipos de eventos
ALTER TABLE public.patrimonio_historico
ADD COLUMN tipo_evento TEXT NOT NULL DEFAULT 'ALTERAÇÃO DE DADO',
ADD COLUMN detalhes_evento TEXT;

-- Atualizar a função de log para incluir o tipo de evento
CREATE OR REPLACE FUNCTION public.log_asset_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_name TEXT;
BEGIN
  -- Buscar nome do usuário
  SELECT full_name INTO v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  -- Registrar cada campo alterado com tipo_evento = 'ALTERAÇÃO DE DADO'
  IF OLD.equipment_name IS DISTINCT FROM NEW.equipment_name THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, tipo_evento, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'ALTERAÇÃO DE DADO', 'Nome do Equipamento', 
      OLD.equipment_name, NEW.equipment_name, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.location_type IS DISTINCT FROM NEW.location_type THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, tipo_evento, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'ALTERAÇÃO DE DADO', 'Local do Equipamento', 
      OLD.location_type, NEW.location_type, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.rental_company IS DISTINCT FROM NEW.rental_company THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, tipo_evento, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'ALTERAÇÃO DE DADO', 'Empresa de Locação', 
      OLD.rental_company, NEW.rental_company, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.rental_work_site IS DISTINCT FROM NEW.rental_work_site THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, tipo_evento, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'ALTERAÇÃO DE DADO', 'Obra de Locação', 
      OLD.rental_work_site, NEW.rental_work_site, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.rental_start_date IS DISTINCT FROM NEW.rental_start_date THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, tipo_evento, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'ALTERAÇÃO DE DADO', 'Data Início Locação', 
      OLD.rental_start_date::TEXT, NEW.rental_start_date::TEXT, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.rental_end_date IS DISTINCT FROM NEW.rental_end_date THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, tipo_evento, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'ALTERAÇÃO DE DADO', 'Data Fim Locação', 
      OLD.rental_end_date::TEXT, NEW.rental_end_date::TEXT, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.deposito_description IS DISTINCT FROM NEW.deposito_description THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, tipo_evento, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'ALTERAÇÃO DE DADO', 'Descrição Depósito', 
      OLD.deposito_description, NEW.deposito_description, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.maintenance_company IS DISTINCT FROM NEW.maintenance_company THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, tipo_evento, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'ALTERAÇÃO DE DADO', 'Empresa de Manutenção', 
      OLD.maintenance_company, NEW.maintenance_company, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.maintenance_work_site IS DISTINCT FROM NEW.maintenance_work_site THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, tipo_evento, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'ALTERAÇÃO DE DADO', 'Obra de Manutenção', 
      OLD.maintenance_work_site, NEW.maintenance_work_site, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.maintenance_description IS DISTINCT FROM NEW.maintenance_description THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, tipo_evento, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'ALTERAÇÃO DE DADO', 'Descrição Manutenção', 
      OLD.maintenance_description, NEW.maintenance_description, auth.uid(), v_user_name
    );
  END IF;

  IF OLD.equipment_observations IS DISTINCT FROM NEW.equipment_observations THEN
    INSERT INTO public.patrimonio_historico (
      pat_id, codigo_pat, tipo_evento, campo_alterado, valor_antigo, valor_novo, 
      usuario_modificacao, usuario_nome
    ) VALUES (
      NEW.id, NEW.asset_code, 'ALTERAÇÃO DE DADO', 'Observações', 
      OLD.equipment_observations, NEW.equipment_observations, auth.uid(), v_user_name
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Criar função auxiliar para registrar eventos customizados no histórico
CREATE OR REPLACE FUNCTION public.registrar_evento_patrimonio(
  p_pat_id UUID,
  p_codigo_pat TEXT,
  p_tipo_evento TEXT,
  p_detalhes_evento TEXT,
  p_campo_alterado TEXT DEFAULT NULL,
  p_valor_antigo TEXT DEFAULT NULL,
  p_valor_novo TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_name TEXT;
  v_historico_id UUID;
BEGIN
  -- Buscar nome do usuário
  SELECT full_name INTO v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  -- Inserir o evento no histórico
  INSERT INTO public.patrimonio_historico (
    pat_id,
    codigo_pat,
    tipo_evento,
    detalhes_evento,
    campo_alterado,
    valor_antigo,
    valor_novo,
    usuario_modificacao,
    usuario_nome
  ) VALUES (
    p_pat_id,
    p_codigo_pat,
    p_tipo_evento,
    p_detalhes_evento,
    p_campo_alterado,
    p_valor_antigo,
    p_valor_novo,
    auth.uid(),
    v_user_name
  )
  RETURNING historico_id INTO v_historico_id;

  RETURN v_historico_id;
END;
$function$;