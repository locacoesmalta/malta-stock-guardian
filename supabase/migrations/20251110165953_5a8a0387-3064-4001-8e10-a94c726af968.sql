-- Função de normalização de texto
CREATE OR REPLACE FUNCTION public.normalize_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN UPPER(TRIM(input_text));
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;

-- View para detectar fabricantes duplicados em ASSETS
CREATE OR REPLACE VIEW public.v_duplicate_manufacturers_assets AS
SELECT 
  public.normalize_text(manufacturer) as fabricante_normalizado,
  ARRAY_AGG(DISTINCT manufacturer ORDER BY manufacturer) as variacoes,
  COUNT(DISTINCT manufacturer) as qtd_variacoes,
  COUNT(*) as total_equipamentos,
  ARRAY_AGG(DISTINCT asset_code ORDER BY asset_code) FILTER (WHERE asset_code IS NOT NULL) as exemplos_pat
FROM public.assets
WHERE deleted_at IS NULL
  AND manufacturer IS NOT NULL
  AND manufacturer != ''
GROUP BY public.normalize_text(manufacturer)
HAVING COUNT(DISTINCT manufacturer) > 1;

-- View para nomes de equipamentos duplicados
CREATE OR REPLACE VIEW public.v_duplicate_equipment_names AS
SELECT 
  public.normalize_text(equipment_name) as equipamento_normalizado,
  ARRAY_AGG(DISTINCT equipment_name ORDER BY equipment_name) as variacoes,
  COUNT(DISTINCT equipment_name) as qtd_variacoes,
  COUNT(*) as total_registros,
  ARRAY_AGG(DISTINCT asset_code ORDER BY asset_code) FILTER (WHERE asset_code IS NOT NULL) as exemplos_pat
FROM public.assets
WHERE deleted_at IS NULL
  AND equipment_name IS NOT NULL
  AND equipment_name != ''
GROUP BY public.normalize_text(equipment_name)
HAVING COUNT(DISTINCT equipment_name) > 1;

-- View para produtos duplicados
CREATE OR REPLACE VIEW public.v_duplicate_products AS
SELECT 
  public.normalize_text(name) as produto_normalizado,
  ARRAY_AGG(DISTINCT name ORDER BY name) as variacoes,
  COUNT(DISTINCT name) as qtd_variacoes,
  COUNT(*) as total_produtos,
  ARRAY_AGG(DISTINCT code ORDER BY code) FILTER (WHERE code IS NOT NULL) as exemplos_codigo
FROM public.products
WHERE deleted_at IS NULL
  AND name IS NOT NULL
  AND name != ''
GROUP BY public.normalize_text(name)
HAVING COUNT(DISTINCT name) > 1;

-- View para fabricantes duplicados em PRODUCTS
CREATE OR REPLACE VIEW public.v_duplicate_manufacturers_products AS
SELECT 
  public.normalize_text(manufacturer) as fabricante_normalizado,
  ARRAY_AGG(DISTINCT manufacturer ORDER BY manufacturer) as variacoes,
  COUNT(DISTINCT manufacturer) as qtd_variacoes,
  COUNT(*) as total_produtos,
  ARRAY_AGG(DISTINCT code ORDER BY code) FILTER (WHERE code IS NOT NULL) as exemplos_codigo
FROM public.products
WHERE deleted_at IS NULL
  AND manufacturer IS NOT NULL
  AND manufacturer != ''
GROUP BY public.normalize_text(manufacturer)
HAVING COUNT(DISTINCT manufacturer) > 1;

-- Função para corrigir fabricantes duplicados em ASSETS
CREATE OR REPLACE FUNCTION public.fix_duplicate_manufacturers_assets(
  p_correct_name TEXT,
  p_variations TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Apenas admins podem executar
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can normalize data';
  END IF;

  -- Atualizar ASSETS
  UPDATE public.assets
  SET 
    manufacturer = p_correct_name,
    updated_at = NOW()
  WHERE manufacturer = ANY(p_variations)
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para corrigir fabricantes duplicados em PRODUCTS
CREATE OR REPLACE FUNCTION public.fix_duplicate_manufacturers_products(
  p_correct_name TEXT,
  p_variations TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Apenas admins podem executar
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can normalize data';
  END IF;

  -- Atualizar PRODUCTS
  UPDATE public.products
  SET 
    manufacturer = p_correct_name,
    updated_at = NOW()
  WHERE manufacturer = ANY(p_variations)
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para corrigir nomes de equipamentos duplicados
CREATE OR REPLACE FUNCTION public.fix_duplicate_equipment_names(
  p_correct_name TEXT,
  p_variations TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Apenas admins podem executar
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can normalize data';
  END IF;

  -- Atualizar ASSETS
  UPDATE public.assets
  SET 
    equipment_name = p_correct_name,
    updated_at = NOW()
  WHERE equipment_name = ANY(p_variations)
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para corrigir nomes de produtos duplicados
CREATE OR REPLACE FUNCTION public.fix_duplicate_product_names(
  p_correct_name TEXT,
  p_variations TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Apenas admins podem executar
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can normalize data';
  END IF;

  -- Atualizar PRODUCTS
  UPDATE public.products
  SET 
    name = p_correct_name,
    updated_at = NOW()
  WHERE name = ANY(p_variations)
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Script de limpeza inicial: remover espaços extras
UPDATE public.assets
SET 
  manufacturer = TRIM(manufacturer),
  equipment_name = TRIM(equipment_name),
  model = TRIM(model)
WHERE deleted_at IS NULL
  AND (
    manufacturer != TRIM(manufacturer) OR
    equipment_name != TRIM(equipment_name) OR
    model != TRIM(model)
  );

UPDATE public.products
SET 
  manufacturer = TRIM(manufacturer),
  name = TRIM(name)
WHERE deleted_at IS NULL
  AND (
    manufacturer != TRIM(manufacturer) OR
    name != TRIM(name)
  );