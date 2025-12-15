-- Atualizar função calculate_next_maintenance para calcular corretamente
-- Próxima manutenção = horímetro atual da última manutenção + intervalo

CREATE OR REPLACE FUNCTION public.calculate_next_maintenance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_last_hourmeter INTEGER;
  v_interval INTEGER;
BEGIN
  -- Usar o horímetro ATUAL registrado na manutenção (não o total acumulado)
  v_last_hourmeter := NEW.current_hourmeter;
  
  -- Determinar intervalo baseado no horímetro atual
  -- 200h = 720000s, 800h = 2880000s, 2000h = 7200000s
  IF v_last_hourmeter < 720000 THEN
    v_interval := 720000; -- Próxima em +200h
  ELSIF v_last_hourmeter < 2880000 THEN
    v_interval := 2880000; -- Próxima em +800h
  ELSE
    v_interval := 7200000; -- Próxima em +2000h
  END IF;
  
  -- Próxima manutenção = horímetro atual + intervalo
  UPDATE assets
  SET 
    next_maintenance_hourmeter = v_last_hourmeter + v_interval,
    maintenance_interval = v_interval,
    maintenance_status = 'em_dia',
    updated_at = NOW()
  WHERE id = NEW.asset_id;
  
  RETURN NEW;
END;
$function$;

-- Recalcular todos os equipamentos existentes com manutenções
WITH last_maintenances AS (
  SELECT DISTINCT ON (asset_id) 
    asset_id,
    current_hourmeter
  FROM asset_maintenances
  WHERE maintenance_type = 'preventiva'
  ORDER BY asset_id, maintenance_date DESC, created_at DESC
)
UPDATE assets a
SET 
  next_maintenance_hourmeter = lm.current_hourmeter + 
    CASE 
      WHEN lm.current_hourmeter < 720000 THEN 720000
      WHEN lm.current_hourmeter < 2880000 THEN 2880000
      ELSE 7200000
    END,
  maintenance_interval = 
    CASE 
      WHEN lm.current_hourmeter < 720000 THEN 720000
      WHEN lm.current_hourmeter < 2880000 THEN 2880000
      ELSE 7200000
    END,
  updated_at = NOW()
FROM last_maintenances lm
WHERE a.id = lm.asset_id;