-- Criar views para detectar duplicatas em models e equipment_types
CREATE OR REPLACE VIEW v_duplicate_models AS
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

CREATE OR REPLACE VIEW v_duplicate_equipment_types AS
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

-- Funções de correção para novos campos
CREATE OR REPLACE FUNCTION public.fix_duplicate_models(
  p_correct_name TEXT,
  p_variations TEXT[]
) RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can normalize data';
  END IF;

  UPDATE public.assets
  SET 
    model = p_correct_name,
    updated_at = NOW()
  WHERE model = ANY(p_variations)
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.fix_duplicate_equipment_types(
  p_correct_name TEXT,
  p_variations TEXT[]
) RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can normalize data';
  END IF;

  UPDATE public.products
  SET 
    equipment_type = p_correct_name,
    updated_at = NOW()
  WHERE equipment_type = ANY(p_variations)
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função de normalização automática completa
CREATE OR REPLACE FUNCTION public.normalize_all_data()
RETURNS TABLE(
  table_name TEXT,
  field_name TEXT,
  records_updated INTEGER
) AS $$
DECLARE
  updated_assets_manufacturer INTEGER := 0;
  updated_assets_equipment_name INTEGER := 0;
  updated_assets_model INTEGER := 0;
  updated_products_name INTEGER := 0;
  updated_products_manufacturer INTEGER := 0;
  updated_products_equipment_type INTEGER := 0;
BEGIN
  -- 1. Normalizar assets.manufacturer
  UPDATE public.assets
  SET manufacturer = public.normalize_text(manufacturer),
      updated_at = NOW()
  WHERE manufacturer IS NOT NULL
    AND manufacturer != public.normalize_text(manufacturer)
    AND deleted_at IS NULL;
  GET DIAGNOSTICS updated_assets_manufacturer = ROW_COUNT;
  
  -- 2. Normalizar assets.equipment_name
  UPDATE public.assets
  SET equipment_name = public.normalize_text(equipment_name),
      updated_at = NOW()
  WHERE equipment_name != public.normalize_text(equipment_name)
    AND deleted_at IS NULL;
  GET DIAGNOSTICS updated_assets_equipment_name = ROW_COUNT;
  
  -- 3. Normalizar assets.model
  UPDATE public.assets
  SET model = public.normalize_text(model),
      updated_at = NOW()
  WHERE model IS NOT NULL
    AND model != public.normalize_text(model)
    AND deleted_at IS NULL;
  GET DIAGNOSTICS updated_assets_model = ROW_COUNT;
  
  -- 4. Normalizar products.name
  UPDATE public.products
  SET name = public.normalize_text(name),
      updated_at = NOW()
  WHERE name != public.normalize_text(name)
    AND deleted_at IS NULL;
  GET DIAGNOSTICS updated_products_name = ROW_COUNT;
  
  -- 5. Normalizar products.manufacturer
  UPDATE public.products
  SET manufacturer = public.normalize_text(manufacturer),
      updated_at = NOW()
  WHERE manufacturer IS NOT NULL
    AND manufacturer != public.normalize_text(manufacturer)
    AND deleted_at IS NULL;
  GET DIAGNOSTICS updated_products_manufacturer = ROW_COUNT;
  
  -- 6. Normalizar products.equipment_type
  UPDATE public.products
  SET equipment_type = public.normalize_text(equipment_type),
      updated_at = NOW()
  WHERE equipment_type IS NOT NULL
    AND equipment_type != public.normalize_text(equipment_type)
    AND deleted_at IS NULL;
  GET DIAGNOSTICS updated_products_equipment_type = ROW_COUNT;
  
  -- Retornar resumo
  RETURN QUERY
  SELECT 'assets'::TEXT, 'manufacturer'::TEXT, updated_assets_manufacturer
  UNION ALL
  SELECT 'assets'::TEXT, 'equipment_name'::TEXT, updated_assets_equipment_name
  UNION ALL
  SELECT 'assets'::TEXT, 'model'::TEXT, updated_assets_model
  UNION ALL
  SELECT 'products'::TEXT, 'name'::TEXT, updated_products_name
  UNION ALL
  SELECT 'products'::TEXT, 'manufacturer'::TEXT, updated_products_manufacturer
  UNION ALL
  SELECT 'products'::TEXT, 'equipment_type'::TEXT, updated_products_equipment_type;
  
  -- Registrar auditoria
  INSERT INTO public.audit_logs (action, table_name, user_email, new_data)
  VALUES (
    'AUTO_NORMALIZATION', 
    'system', 
    'cron@malta.com', 
    jsonb_build_object(
      'assets_manufacturer', updated_assets_manufacturer,
      'assets_equipment_name', updated_assets_equipment_name,
      'assets_model', updated_assets_model,
      'products_name', updated_products_name,
      'products_manufacturer', updated_products_manufacturer,
      'products_equipment_type', updated_products_equipment_type,
      'timestamp', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;