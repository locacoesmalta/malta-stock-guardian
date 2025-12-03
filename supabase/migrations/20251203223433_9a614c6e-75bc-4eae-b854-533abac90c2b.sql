-- Adicionar campo previous_hourmeter à tabela maintenance_plans
ALTER TABLE maintenance_plans 
ADD COLUMN IF NOT EXISTS previous_hourmeter integer DEFAULT 0;

-- Atualizar função para retornar AMBOS os horímetros da última manutenção preventiva
CREATE OR REPLACE FUNCTION public.get_last_maintenance_hourmeters(p_asset_id uuid)
RETURNS TABLE(previous_hourmeter integer, current_hourmeter integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(previous_hourmeter, 0)::integer as previous_hourmeter,
    COALESCE(current_hourmeter, 0)::integer as current_hourmeter
  FROM asset_maintenances
  WHERE asset_id = p_asset_id
    AND maintenance_type = 'preventiva'
  ORDER BY maintenance_date DESC, created_at DESC
  LIMIT 1;
$$;

-- Atualizar planos existentes com o previous_hourmeter correto (baseado no current_hourmeter salvo)
-- Se o current_hourmeter do plano corresponde a alguma manutenção, buscar o previous_hourmeter dessa manutenção
UPDATE maintenance_plans mp
SET previous_hourmeter = COALESCE(
  (
    SELECT am.previous_hourmeter 
    FROM asset_maintenances am 
    WHERE am.asset_id = mp.asset_id 
      AND am.current_hourmeter = mp.current_hourmeter
      AND am.maintenance_type = 'preventiva'
    LIMIT 1
  ), 0
)
WHERE mp.previous_hourmeter IS NULL OR mp.previous_hourmeter = 0;