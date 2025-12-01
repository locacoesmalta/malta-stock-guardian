-- Adicionar SET search_path na função update_system_integrity_resolutions_updated_at
CREATE OR REPLACE FUNCTION public.update_system_integrity_resolutions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;