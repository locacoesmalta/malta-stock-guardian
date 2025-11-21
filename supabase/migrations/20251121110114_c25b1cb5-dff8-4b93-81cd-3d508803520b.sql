-- FASE 1: Correção de Segurança - Adicionar search_path às funções
-- Fix: Usar DROP FUNCTION para funções com RETURNS TABLE

-- 1. check_assets_integrity() - DROP e CREATE
DROP FUNCTION IF EXISTS public.check_assets_integrity();

CREATE FUNCTION public.check_assets_integrity()
RETURNS TABLE(
  asset_id uuid,
  asset_code text,
  issue_type text,
  details text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    a.id,
    a.asset_code,
    CASE
      WHEN a.manufacturer IS NULL OR a.manufacturer = '' 
        THEN 'Fabricante ausente'
      WHEN a.location_type = 'em_manutencao' 
        AND a.maintenance_arrival_date IS NULL
        THEN 'Em manutenção sem data de entrada'
      WHEN a.location_type = 'alugado' 
        AND a.rental_start_date IS NULL
        THEN 'Alugado sem data de início'
      ELSE 'OK'
    END as issue_type,
    CASE
      WHEN a.manufacturer IS NULL OR a.manufacturer = '' 
        THEN 'Equipamento sem fabricante cadastrado'
      WHEN a.location_type = 'em_manutencao' 
        AND a.maintenance_arrival_date IS NULL
        THEN 'Equipamento marcado como em manutenção mas sem data de entrada registrada'
      WHEN a.location_type = 'alugado' 
        AND a.rental_start_date IS NULL
        THEN 'Equipamento marcado como alugado mas sem data de início de locação'
      ELSE 'Nenhum problema detectado'
    END as details
  FROM assets a
  WHERE a.deleted_at IS NULL
    AND (
      a.manufacturer IS NULL 
      OR a.manufacturer = ''
      OR (a.location_type = 'em_manutencao' AND a.maintenance_arrival_date IS NULL)
      OR (a.location_type = 'alugado' AND a.rental_start_date IS NULL)
    );
$function$;

-- 2. check_withdrawals_integrity() - DROP e CREATE
DROP FUNCTION IF EXISTS public.check_withdrawals_integrity();

CREATE FUNCTION public.check_withdrawals_integrity()
RETURNS TABLE(
  withdrawal_id uuid,
  equipment_code text,
  product_name text,
  issue_type text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    mw.id,
    mw.equipment_code,
    p.name,
    CASE
      WHEN mw.quantity <= 0 
        THEN 'Quantidade inválida'
      WHEN NOT EXISTS(SELECT 1 FROM assets WHERE asset_code = mw.equipment_code)
        THEN 'Equipamento não encontrado'
      ELSE 'OK'
    END as issue_type
  FROM material_withdrawals mw
  JOIN products p ON p.id = mw.product_id
  WHERE 
    mw.quantity <= 0
    OR NOT EXISTS(SELECT 1 FROM assets WHERE asset_code = mw.equipment_code);
$function$;

-- 3. check_reports_integrity() - DROP e CREATE
DROP FUNCTION IF EXISTS public.check_reports_integrity();

CREATE FUNCTION public.check_reports_integrity()
RETURNS TABLE(
  report_id uuid,
  equipment_code text,
  report_date date,
  issue_type text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    r.id,
    r.equipment_code,
    r.report_date,
    CASE
      WHEN r.service_comments IS NULL OR r.service_comments = '' 
        THEN 'Relatório sem comentários'
      WHEN NOT EXISTS(SELECT 1 FROM assets WHERE asset_code = r.equipment_code)
        THEN 'Equipamento não encontrado'
      ELSE 'OK'
    END as issue_type
  FROM reports r
  WHERE r.deleted_at IS NULL
    AND (
      r.service_comments IS NULL 
      OR r.service_comments = ''
      OR NOT EXISTS(SELECT 1 FROM assets WHERE asset_code = r.equipment_code)
    );
$function$;

-- 4. check_products_stock_integrity() - DROP e CREATE
DROP FUNCTION IF EXISTS public.check_products_stock_integrity();

CREATE FUNCTION public.check_products_stock_integrity()
RETURNS TABLE(
  product_id uuid,
  product_code text,
  product_name text,
  current_quantity integer,
  issue_type text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    p.id,
    p.code,
    p.name,
    p.quantity,
    CASE
      WHEN p.quantity < 0 
        THEN 'Estoque negativo'
      WHEN p.quantity = 0
        THEN 'Estoque zerado'
      WHEN p.quantity <= p.min_quantity
        THEN 'Estoque abaixo do mínimo'
      ELSE 'OK'
    END as issue_type
  FROM products p
  WHERE p.deleted_at IS NULL
    AND p.id != '00000000-0000-0000-0000-000000000001'::uuid
    AND (
      p.quantity < 0 
      OR p.quantity = 0 
      OR p.quantity <= p.min_quantity
    );
$function$;

-- 5. is_programmatic_operation() - CREATE OR REPLACE funciona aqui
CREATE OR REPLACE FUNCTION public.is_programmatic_operation()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN COALESCE(current_setting('app.bypass_audit_trigger', true)::boolean, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$function$;

-- 6. log_asset_changes() - CREATE OR REPLACE funciona aqui
CREATE OR REPLACE FUNCTION public.log_asset_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  IF is_programmatic_operation() THEN
    RETURN NEW;
  END IF;

  v_user_id := auth.uid();
  
  SELECT COALESCE(raw_user_meta_data->>'full_name', email)
  INTO v_user_name
  FROM auth.users
  WHERE id = v_user_id;

  old_json := to_jsonb(OLD);
  new_json := to_jsonb(NEW);

  changed_fields := ARRAY(
    SELECT key
    FROM jsonb_each(new_json)
    WHERE new_json->>key IS DISTINCT FROM old_json->>key
      AND key NOT IN ('updated_at', 'created_at')
  );

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
$function$;

-- 7. validate_report_parts_quantity() - CREATE OR REPLACE funciona aqui
CREATE OR REPLACE FUNCTION public.validate_report_parts_quantity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_withdrawal_quantity INTEGER;
  v_used_quantity INTEGER;
  v_product_id UUID;
  v_non_cataloged_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
  IF NEW.withdrawal_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT product_id INTO v_product_id
  FROM material_withdrawals
  WHERE id = NEW.withdrawal_id;

  IF v_product_id = v_non_cataloged_id THEN
    RETURN NEW;
  END IF;

  SELECT quantity INTO v_withdrawal_quantity
  FROM material_withdrawals
  WHERE id = NEW.withdrawal_id;

  SELECT COALESCE(SUM(quantity_used), 0) INTO v_used_quantity
  FROM report_parts
  WHERE withdrawal_id = NEW.withdrawal_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

  IF (v_used_quantity + NEW.quantity_used) > v_withdrawal_quantity THEN
    RAISE EXCEPTION 'Quantidade usada (%) excede a quantidade retirada (%) para esta peça', 
      (v_used_quantity + NEW.quantity_used), v_withdrawal_quantity;
  END IF;

  RETURN NEW;
END;
$function$;