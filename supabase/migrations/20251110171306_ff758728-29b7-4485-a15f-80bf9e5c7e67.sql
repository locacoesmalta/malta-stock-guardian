-- Recriar todas as views sem SECURITY DEFINER
-- Isso faz com que as views usem as permissões do usuário que executa a query, não do criador

DROP VIEW IF EXISTS v_duplicate_manufacturers_assets CASCADE;
DROP VIEW IF EXISTS v_duplicate_equipment_names CASCADE;
DROP VIEW IF EXISTS v_duplicate_products CASCADE;
DROP VIEW IF EXISTS v_duplicate_manufacturers_products CASCADE;
DROP VIEW IF EXISTS v_duplicate_models CASCADE;
DROP VIEW IF EXISTS v_duplicate_equipment_types CASCADE;

-- Recriar v_duplicate_manufacturers_assets
CREATE VIEW v_duplicate_manufacturers_assets AS
WITH ranked_manufacturers AS (
  SELECT 
    public.normalize_text(manufacturer) as fabricante_normalizado,
    manufacturer,
    asset_code,
    ROW_NUMBER() OVER (PARTITION BY public.normalize_text(manufacturer) ORDER BY asset_code) as rn
  FROM public.assets
  WHERE deleted_at IS NULL
    AND manufacturer IS NOT NULL
    AND manufacturer != ''
)
SELECT 
  fabricante_normalizado,
  ARRAY_AGG(DISTINCT manufacturer ORDER BY manufacturer) as variacoes,
  COUNT(DISTINCT manufacturer) as qtd_variacoes,
  (SELECT COUNT(*) FROM public.assets WHERE public.normalize_text(manufacturer) = rm.fabricante_normalizado AND deleted_at IS NULL) as total_equipamentos,
  ARRAY_AGG(asset_code) FILTER (WHERE rn <= 5) as exemplos_pat
FROM ranked_manufacturers rm
GROUP BY fabricante_normalizado
HAVING COUNT(DISTINCT manufacturer) > 1
ORDER BY COUNT(*) DESC;

-- Recriar v_duplicate_equipment_names
CREATE VIEW v_duplicate_equipment_names AS
WITH ranked_equipment AS (
  SELECT 
    public.normalize_text(equipment_name) as equipamento_normalizado,
    equipment_name,
    asset_code,
    ROW_NUMBER() OVER (PARTITION BY public.normalize_text(equipment_name) ORDER BY asset_code) as rn
  FROM public.assets
  WHERE deleted_at IS NULL
)
SELECT 
  equipamento_normalizado,
  ARRAY_AGG(DISTINCT equipment_name ORDER BY equipment_name) as variacoes,
  COUNT(DISTINCT equipment_name) as qtd_variacoes,
  (SELECT COUNT(*) FROM public.assets WHERE public.normalize_text(equipment_name) = re.equipamento_normalizado AND deleted_at IS NULL) as total_registros,
  ARRAY_AGG(asset_code) FILTER (WHERE rn <= 5) as exemplos_pat
FROM ranked_equipment re
GROUP BY equipamento_normalizado
HAVING COUNT(DISTINCT equipment_name) > 1
ORDER BY COUNT(*) DESC;

-- Recriar v_duplicate_products
CREATE VIEW v_duplicate_products AS
WITH ranked_products AS (
  SELECT 
    public.normalize_text(name) as produto_normalizado,
    name,
    code,
    ROW_NUMBER() OVER (PARTITION BY public.normalize_text(name) ORDER BY code) as rn
  FROM public.products
  WHERE deleted_at IS NULL
)
SELECT 
  produto_normalizado,
  ARRAY_AGG(DISTINCT name ORDER BY name) as variacoes,
  COUNT(DISTINCT name) as qtd_variacoes,
  (SELECT COUNT(*) FROM public.products WHERE public.normalize_text(name) = rp.produto_normalizado AND deleted_at IS NULL) as total_produtos,
  ARRAY_AGG(code) FILTER (WHERE rn <= 5) as exemplos_codigo
FROM ranked_products rp
GROUP BY produto_normalizado
HAVING COUNT(DISTINCT name) > 1
ORDER BY COUNT(*) DESC;

-- Recriar v_duplicate_manufacturers_products
CREATE VIEW v_duplicate_manufacturers_products AS
WITH ranked_mfg AS (
  SELECT 
    public.normalize_text(manufacturer) as fabricante_normalizado,
    manufacturer,
    code,
    ROW_NUMBER() OVER (PARTITION BY public.normalize_text(manufacturer) ORDER BY code) as rn
  FROM public.products
  WHERE deleted_at IS NULL
    AND manufacturer IS NOT NULL
    AND manufacturer != ''
)
SELECT 
  fabricante_normalizado,
  ARRAY_AGG(DISTINCT manufacturer ORDER BY manufacturer) as variacoes,
  COUNT(DISTINCT manufacturer) as qtd_variacoes,
  (SELECT COUNT(*) FROM public.products WHERE public.normalize_text(manufacturer) = rm.fabricante_normalizado AND deleted_at IS NULL) as total_produtos,
  ARRAY_AGG(code) FILTER (WHERE rn <= 5) as exemplos_codigo
FROM ranked_mfg rm
GROUP BY fabricante_normalizado
HAVING COUNT(DISTINCT manufacturer) > 1
ORDER BY COUNT(*) DESC;

-- Recriar v_duplicate_models
CREATE VIEW v_duplicate_models AS
WITH ranked_models AS (
  SELECT 
    public.normalize_text(model) as modelo_normalizado,
    model,
    asset_code,
    ROW_NUMBER() OVER (PARTITION BY public.normalize_text(model) ORDER BY asset_code) as rn
  FROM public.assets
  WHERE deleted_at IS NULL
    AND model IS NOT NULL
    AND model != ''
)
SELECT 
  modelo_normalizado,
  ARRAY_AGG(DISTINCT model ORDER BY model) as variacoes,
  COUNT(DISTINCT model) as qtd_variacoes,
  (SELECT COUNT(*) FROM public.assets WHERE public.normalize_text(model) = rm.modelo_normalizado AND deleted_at IS NULL) as total_equipamentos,
  ARRAY_AGG(asset_code) FILTER (WHERE rn <= 5) as exemplos_pat
FROM ranked_models rm
GROUP BY modelo_normalizado
HAVING COUNT(DISTINCT model) > 1
ORDER BY COUNT(*) DESC;

-- Recriar v_duplicate_equipment_types
CREATE VIEW v_duplicate_equipment_types AS
WITH ranked_types AS (
  SELECT 
    public.normalize_text(equipment_type) as tipo_normalizado,
    equipment_type,
    code,
    ROW_NUMBER() OVER (PARTITION BY public.normalize_text(equipment_type) ORDER BY code) as rn
  FROM public.products
  WHERE deleted_at IS NULL
    AND equipment_type IS NOT NULL
    AND equipment_type != ''
)
SELECT 
  tipo_normalizado,
  ARRAY_AGG(DISTINCT equipment_type ORDER BY equipment_type) as variacoes,
  COUNT(DISTINCT equipment_type) as qtd_variacoes,
  (SELECT COUNT(*) FROM public.products WHERE public.normalize_text(equipment_type) = rt.tipo_normalizado AND deleted_at IS NULL) as total_produtos,
  ARRAY_AGG(code) FILTER (WHERE rn <= 5) as exemplos_codigo
FROM ranked_types rt
GROUP BY tipo_normalizado
HAVING COUNT(DISTINCT equipment_type) > 1
ORDER BY COUNT(*) DESC;