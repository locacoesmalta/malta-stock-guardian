-- Recriar v_asset_movement_inconsistencies com security_invoker
DROP VIEW IF EXISTS public.v_asset_movement_inconsistencies CASCADE;

CREATE VIEW public.v_asset_movement_inconsistencies
WITH (security_invoker = true)
AS
SELECT 
  a.asset_code,
  a.equipment_name,
  a.substitution_date,
  COALESCE(a.effective_registration_date, a.created_at::date) AS registration_date,
  a.substitution_date - COALESCE(a.effective_registration_date, a.created_at::date) AS days_difference,
  'Substituição antes do cadastro'::text AS inconsistency_type
FROM assets a
WHERE a.was_replaced = true 
  AND a.substitution_date IS NOT NULL 
  AND a.substitution_date < COALESCE(a.effective_registration_date, a.created_at::date)

UNION ALL

SELECT 
  a.asset_code,
  a.equipment_name,
  a.rental_start_date AS substitution_date,
  COALESCE(a.effective_registration_date, a.created_at::date) AS registration_date,
  a.rental_start_date - COALESCE(a.effective_registration_date, a.created_at::date) AS days_difference,
  'Locação antes do cadastro'::text AS inconsistency_type
FROM assets a
WHERE a.rental_start_date IS NOT NULL 
  AND a.rental_start_date < COALESCE(a.effective_registration_date, a.created_at::date)

UNION ALL

SELECT 
  a.asset_code,
  a.equipment_name,
  a.maintenance_arrival_date AS substitution_date,
  COALESCE(a.effective_registration_date, a.created_at::date) AS registration_date,
  a.maintenance_arrival_date - COALESCE(a.effective_registration_date, a.created_at::date) AS days_difference,
  'Manutenção antes do cadastro'::text AS inconsistency_type
FROM assets a
WHERE a.maintenance_arrival_date IS NOT NULL 
  AND a.maintenance_arrival_date < COALESCE(a.effective_registration_date, a.created_at::date);