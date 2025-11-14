-- ====================================================================
-- FASE 2: Adicionar flag de proteção contra edições manuais
-- ====================================================================

-- Adicionar coluna locked_for_manual_edit na tabela assets
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS locked_for_manual_edit BOOLEAN DEFAULT FALSE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_assets_locked_manual_edit 
ON public.assets(locked_for_manual_edit) 
WHERE locked_for_manual_edit = TRUE;

COMMENT ON COLUMN public.assets.locked_for_manual_edit IS 
'Flag que indica se o equipamento está bloqueado para edições manuais de status (ex: após substituição)';

-- ====================================================================
-- FASE 3: Modificar trigger para evitar duplicação de registros
-- ====================================================================

-- Criar função para verificar se operação é programática
CREATE OR REPLACE FUNCTION is_programmatic_operation()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica se existe a flag de sessão indicando operação programática
  RETURN COALESCE(current_setting('app.bypass_audit_trigger', true)::boolean, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar trigger de auditoria para respeitar operações programáticas
CREATE OR REPLACE FUNCTION log_asset_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  old_json JSONB;
  new_json JSONB;
  changed_fields TEXT[];
  field_name TEXT;
  old_value TEXT;
  new_value TEXT;
BEGIN
  -- Se for operação programática, pular auditoria automática
  IF is_programmatic_operation() THEN
    RETURN NEW;
  END IF;

  -- Obter ID e nome do usuário autenticado
  v_user_id := auth.uid();
  
  SELECT COALESCE(raw_user_meta_data->>'full_name', email)
  INTO v_user_name
  FROM auth.users
  WHERE id = v_user_id;

  -- Converter OLD e NEW para JSONB
  old_json := to_jsonb(OLD);
  new_json := to_jsonb(NEW);

  -- Detectar campos alterados
  changed_fields := ARRAY(
    SELECT key
    FROM jsonb_each(new_json)
    WHERE new_json->>key IS DISTINCT FROM old_json->>key
      AND key NOT IN ('updated_at', 'created_at')
  );

  -- Registrar mudanças no histórico
  FOREACH field_name IN ARRAY changed_fields
  LOOP
    old_value := old_json->>field_name;
    new_value := new_json->>field_name;
    
    INSERT INTO patrimonio_historico (
      pat_id,
      codigo_pat,
      tipo_evento,
      campo_alterado,
      valor_antigo,
      valor_novo,
      detalhes_evento,
      usuario_modificacao,
      usuario_nome
    ) VALUES (
      NEW.id,
      NEW.asset_code,
      'ALTERAÇÃO DE DADO',
      field_name,
      old_value,
      new_value,
      format('Campo "%s" alterado de "%s" para "%s"', field_name, old_value, new_value),
      v_user_id,
      v_user_name
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- FASE 5: Correção de dados existentes
-- ====================================================================

-- 5.1: Identificar e reportar substituições com datas inconsistentes
DO $$
DECLARE
  inconsistent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inconsistent_count
  FROM assets a
  WHERE a.was_replaced = true
    AND a.substitution_date IS NOT NULL
    AND a.substitution_date < COALESCE(a.effective_registration_date, a.created_at::date);
    
  IF inconsistent_count > 0 THEN
    RAISE NOTICE 'ATENÇÃO: Foram encontradas % substituições com datas inconsistentes (data de substituição anterior ao cadastro)', inconsistent_count;
  END IF;
END $$;

-- 5.2: Corrigir PAT 001427 de volta para aguardando_laudo (se aplicável)
UPDATE public.assets
SET 
  location_type = 'aguardando_laudo',
  locked_for_manual_edit = TRUE
WHERE asset_code = '001427'
  AND was_replaced = TRUE
  AND location_type != 'aguardando_laudo';

-- 5.3: Marcar todos os equipamentos substituídos como bloqueados para edição manual
UPDATE public.assets
SET locked_for_manual_edit = TRUE
WHERE was_replaced = TRUE;

-- 5.4: Limpar registros duplicados no histórico
-- Manter apenas registros de MOVIMENTAÇÃO quando há duplicação com ALTERAÇÃO DE DADO
WITH duplicates AS (
  SELECT 
    historico_id,
    pat_id,
    campo_alterado,
    data_modificacao,
    tipo_evento,
    ROW_NUMBER() OVER (
      PARTITION BY pat_id, campo_alterado, DATE_TRUNC('second', data_modificacao)
      ORDER BY 
        CASE WHEN tipo_evento = 'MOVIMENTAÇÃO' THEN 1
             WHEN tipo_evento = 'SUBSTITUIÇÃO' THEN 2
             ELSE 3
        END
    ) as rn
  FROM patrimonio_historico
  WHERE tipo_evento IN ('ALTERAÇÃO DE DADO', 'MOVIMENTAÇÃO', 'SUBSTITUIÇÃO')
    AND campo_alterado IN ('location_type', 'rental_company', 'maintenance_company')
)
DELETE FROM patrimonio_historico
WHERE historico_id IN (
  SELECT historico_id 
  FROM duplicates 
  WHERE rn > 1
);

-- ====================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ====================================================================

COMMENT ON FUNCTION is_programmatic_operation() IS 
'Verifica se a operação atual é programática (via RPC) e deve pular auditoria automática';

COMMENT ON FUNCTION log_asset_changes() IS 
'Trigger function que registra mudanças em assets, mas pula operações programáticas para evitar duplicação';

-- Criar view para monitorar inconsistências
CREATE OR REPLACE VIEW v_asset_movement_inconsistencies AS
SELECT 
  a.asset_code,
  a.equipment_name,
  a.substitution_date,
  COALESCE(a.effective_registration_date, a.created_at::date) as registration_date,
  a.substitution_date - COALESCE(a.effective_registration_date, a.created_at::date) as days_difference,
  'Substituição antes do cadastro' as inconsistency_type
FROM assets a
WHERE a.was_replaced = TRUE
  AND a.substitution_date IS NOT NULL
  AND a.substitution_date < COALESCE(a.effective_registration_date, a.created_at::date)

UNION ALL

SELECT 
  a.asset_code,
  a.equipment_name,
  a.rental_start_date,
  COALESCE(a.effective_registration_date, a.created_at::date) as registration_date,
  a.rental_start_date - COALESCE(a.effective_registration_date, a.created_at::date) as days_difference,
  'Locação antes do cadastro' as inconsistency_type
FROM assets a
WHERE a.rental_start_date IS NOT NULL
  AND a.rental_start_date < COALESCE(a.effective_registration_date, a.created_at::date)

UNION ALL

SELECT 
  a.asset_code,
  a.equipment_name,
  a.maintenance_arrival_date,
  COALESCE(a.effective_registration_date, a.created_at::date) as registration_date,
  a.maintenance_arrival_date - COALESCE(a.effective_registration_date, a.created_at::date) as days_difference,
  'Manutenção antes do cadastro' as inconsistency_type
FROM assets a
WHERE a.maintenance_arrival_date IS NOT NULL
  AND a.maintenance_arrival_date < COALESCE(a.effective_registration_date, a.created_at::date);

COMMENT ON VIEW v_asset_movement_inconsistencies IS 
'View para monitorar inconsistências temporais em movimentações de equipamentos';