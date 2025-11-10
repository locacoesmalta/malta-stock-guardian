-- Função para identificar equipamentos sem fabricante cadastrado
CREATE OR REPLACE FUNCTION public.get_assets_missing_manufacturer()
RETURNS TABLE(
  id UUID,
  asset_code TEXT,
  equipment_name TEXT,
  location_type TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.asset_code,
    a.equipment_name,
    a.location_type,
    a.created_at
  FROM assets a
  WHERE a.deleted_at IS NULL
  AND (a.manufacturer IS NULL OR a.manufacturer = '');
END;
$$;