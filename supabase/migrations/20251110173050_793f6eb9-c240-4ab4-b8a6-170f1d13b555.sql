-- Corrigir Security Definer Views
-- Remover views existentes e recriar sem SECURITY DEFINER

-- Drop views antigas
DROP VIEW IF EXISTS public.v_duplicate_manufacturers_assets CASCADE;
DROP VIEW IF EXISTS public.v_duplicate_equipment_names CASCADE;
DROP VIEW IF EXISTS public.v_duplicate_products CASCADE;
DROP VIEW IF EXISTS public.v_duplicate_manufacturers_products CASCADE;
DROP VIEW IF EXISTS public.v_duplicate_models CASCADE;
DROP VIEW IF EXISTS public.v_duplicate_equipment_types CASCADE;

-- Recriar views SEM SECURITY DEFINER (usar SECURITY INVOKER por padrão)
CREATE OR REPLACE VIEW public.v_duplicate_manufacturers_assets 
WITH (security_invoker = true)
AS
SELECT 
  UPPER(TRIM(manufacturer)) as fabricante_normalizado,
  COUNT(DISTINCT manufacturer) as qtd_variacoes,
  COUNT(*) as total_equipamentos,
  ARRAY_AGG(DISTINCT manufacturer ORDER BY manufacturer) as variacoes,
  ARRAY_AGG(DISTINCT asset_code ORDER BY asset_code) FILTER (WHERE asset_code IS NOT NULL) as exemplos_pat
FROM public.assets
WHERE manufacturer IS NOT NULL 
  AND deleted_at IS NULL
GROUP BY UPPER(TRIM(manufacturer))
HAVING COUNT(DISTINCT manufacturer) > 1;

CREATE OR REPLACE VIEW public.v_duplicate_equipment_names
WITH (security_invoker = true)
AS
SELECT 
  UPPER(TRIM(equipment_name)) as equipamento_normalizado,
  COUNT(DISTINCT equipment_name) as qtd_variacoes,
  COUNT(*) as total_registros,
  ARRAY_AGG(DISTINCT equipment_name ORDER BY equipment_name) as variacoes,
  ARRAY_AGG(DISTINCT asset_code ORDER BY asset_code) as exemplos_pat
FROM public.assets
WHERE equipment_name IS NOT NULL 
  AND deleted_at IS NULL
GROUP BY UPPER(TRIM(equipment_name))
HAVING COUNT(DISTINCT equipment_name) > 1;

CREATE OR REPLACE VIEW public.v_duplicate_products
WITH (security_invoker = true)
AS
SELECT 
  UPPER(TRIM(name)) as produto_normalizado,
  COUNT(DISTINCT name) as qtd_variacoes,
  COUNT(*) as total_produtos,
  ARRAY_AGG(DISTINCT name ORDER BY name) as variacoes,
  ARRAY_AGG(DISTINCT code ORDER BY code) as exemplos_codigo
FROM public.products
WHERE name IS NOT NULL 
  AND deleted_at IS NULL
GROUP BY UPPER(TRIM(name))
HAVING COUNT(DISTINCT name) > 1;

CREATE OR REPLACE VIEW public.v_duplicate_manufacturers_products
WITH (security_invoker = true)
AS
SELECT 
  UPPER(TRIM(manufacturer)) as fabricante_normalizado,
  COUNT(DISTINCT manufacturer) as qtd_variacoes,
  COUNT(*) as total_produtos,
  ARRAY_AGG(DISTINCT manufacturer ORDER BY manufacturer) as variacoes,
  ARRAY_AGG(DISTINCT code ORDER BY code) FILTER (WHERE code IS NOT NULL) as exemplos_codigo
FROM public.products
WHERE manufacturer IS NOT NULL 
  AND deleted_at IS NULL
GROUP BY UPPER(TRIM(manufacturer))
HAVING COUNT(DISTINCT manufacturer) > 1;

CREATE OR REPLACE VIEW public.v_duplicate_models
WITH (security_invoker = true)
AS
SELECT 
  UPPER(TRIM(model)) as modelo_normalizado,
  COUNT(DISTINCT model) as qtd_variacoes,
  COUNT(*) as total_equipamentos,
  ARRAY_AGG(DISTINCT model ORDER BY model) as variacoes,
  ARRAY_AGG(DISTINCT asset_code ORDER BY asset_code) FILTER (WHERE asset_code IS NOT NULL) as exemplos_pat
FROM public.assets
WHERE model IS NOT NULL 
  AND deleted_at IS NULL
GROUP BY UPPER(TRIM(model))
HAVING COUNT(DISTINCT model) > 1;

CREATE OR REPLACE VIEW public.v_duplicate_equipment_types
WITH (security_invoker = true)
AS
SELECT 
  UPPER(TRIM(equipment_type)) as tipo_normalizado,
  COUNT(DISTINCT equipment_type) as qtd_variacoes,
  COUNT(*) as total_produtos,
  ARRAY_AGG(DISTINCT equipment_type ORDER BY equipment_type) as variacoes,
  ARRAY_AGG(DISTINCT code ORDER BY code) FILTER (WHERE code IS NOT NULL) as exemplos_codigo
FROM public.products
WHERE equipment_type IS NOT NULL 
  AND deleted_at IS NULL
GROUP BY UPPER(TRIM(equipment_type))
HAVING COUNT(DISTINCT equipment_type) > 1;

-- Habilitar RLS nas views
ALTER VIEW public.v_duplicate_manufacturers_assets SET (security_invoker = true);
ALTER VIEW public.v_duplicate_equipment_names SET (security_invoker = true);
ALTER VIEW public.v_duplicate_products SET (security_invoker = true);
ALTER VIEW public.v_duplicate_manufacturers_products SET (security_invoker = true);
ALTER VIEW public.v_duplicate_models SET (security_invoker = true);
ALTER VIEW public.v_duplicate_equipment_types SET (security_invoker = true);

-- Comentários explicativos
COMMENT ON VIEW public.v_duplicate_manufacturers_assets IS 'View com security_invoker que respeita as permissões RLS do usuário logado';
COMMENT ON VIEW public.v_duplicate_equipment_names IS 'View com security_invoker que respeita as permissões RLS do usuário logado';
COMMENT ON VIEW public.v_duplicate_products IS 'View com security_invoker que respeita as permissões RLS do usuário logado';
COMMENT ON VIEW public.v_duplicate_manufacturers_products IS 'View com security_invoker que respeita as permissões RLS do usuário logado';
COMMENT ON VIEW public.v_duplicate_models IS 'View com security_invoker que respeita as permissões RLS do usuário logado';
COMMENT ON VIEW public.v_duplicate_equipment_types IS 'View com security_invoker que respeita as permissões RLS do usuário logado';