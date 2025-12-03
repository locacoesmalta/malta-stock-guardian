-- Criar função para buscar o horímetro da última manutenção preventiva
CREATE OR REPLACE FUNCTION public.get_last_maintenance_hourmeter(p_asset_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(current_hourmeter, 0)
  FROM asset_maintenances
  WHERE asset_id = p_asset_id
    AND maintenance_type = 'preventiva'
  ORDER BY maintenance_date DESC, created_at DESC
  LIMIT 1;
$$;