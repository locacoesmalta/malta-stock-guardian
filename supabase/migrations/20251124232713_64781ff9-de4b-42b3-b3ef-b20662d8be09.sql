-- Atualizar função update_rental_catalog_updated_at para incluir search_path (usando CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.update_rental_catalog_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;