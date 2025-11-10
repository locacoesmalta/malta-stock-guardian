-- FASE 1: Estrutura de Dados - Sistema de Compatibilidade de Peças

-- 1.1 Adicionar campos de compatibilidade na tabela products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS equipment_brand TEXT NULL,
ADD COLUMN IF NOT EXISTS equipment_type TEXT NULL,
ADD COLUMN IF NOT EXISTS equipment_model TEXT NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_products_compatibility ON products(equipment_brand, equipment_type, equipment_model);

-- Adicionar comentários explicativos
COMMENT ON COLUMN products.equipment_brand IS 'Marca do equipamento compatível (ex: Makita). NULL = peça universal';
COMMENT ON COLUMN products.equipment_type IS 'Tipo do equipamento compatível (ex: Serra Mármore). NULL = peça universal';
COMMENT ON COLUMN products.equipment_model IS 'Modelo específico compatível (ex: 4100NH3 110V). NULL = peça universal';

-- 1.2 Criar função SQL para filtrar produtos compatíveis
CREATE OR REPLACE FUNCTION public.get_compatible_products(
  p_equipment_brand TEXT,
  p_equipment_type TEXT,
  p_equipment_model TEXT
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  name TEXT,
  manufacturer TEXT,
  quantity INTEGER,
  min_quantity INTEGER,
  purchase_price NUMERIC,
  sale_price NUMERIC,
  is_universal BOOLEAN,
  compatibility_level TEXT
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.code,
    p.name,
    p.manufacturer,
    p.quantity,
    p.min_quantity,
    p.purchase_price,
    p.sale_price,
    -- Peça é universal se todos os campos forem NULL
    (p.equipment_brand IS NULL AND p.equipment_type IS NULL AND p.equipment_model IS NULL) as is_universal,
    -- Classificar compatibilidade
    CASE
      WHEN p.equipment_brand IS NULL AND p.equipment_type IS NULL AND p.equipment_model IS NULL 
        THEN 'universal'
      WHEN p.equipment_brand = p_equipment_brand 
        AND p.equipment_type = p_equipment_type 
        AND p.equipment_model = p_equipment_model 
        THEN 'exact_match'
      WHEN p.equipment_brand = p_equipment_brand 
        AND p.equipment_type = p_equipment_type 
        AND p.equipment_model IS NULL
        THEN 'type_match'
      WHEN p.equipment_brand = p_equipment_brand 
        AND p.equipment_type IS NULL
        AND p.equipment_model IS NULL
        THEN 'brand_match'
      ELSE 'incompatible'
    END as compatibility_level
  FROM products p
  WHERE 
    -- Peças universais (NULL em todos os campos)
    (p.equipment_brand IS NULL AND p.equipment_type IS NULL AND p.equipment_model IS NULL)
    OR
    -- Compatibilidade exata (modelo específico)
    (p.equipment_brand = p_equipment_brand 
     AND p.equipment_type = p_equipment_type 
     AND p.equipment_model = p_equipment_model)
    OR
    -- Compatibilidade por tipo (qualquer modelo daquele tipo)
    (p.equipment_brand = p_equipment_brand 
     AND p.equipment_type = p_equipment_type 
     AND p.equipment_model IS NULL)
    OR
    -- Compatibilidade por marca (qualquer equipamento da marca)
    (p.equipment_brand = p_equipment_brand 
     AND p.equipment_type IS NULL
     AND p.equipment_model IS NULL)
  ORDER BY 
    -- Ordenar: específicas primeiro, depois universais
    CASE 
      WHEN p.equipment_brand IS NULL AND p.equipment_type IS NULL AND p.equipment_model IS NULL THEN 4
      WHEN p.equipment_brand = p_equipment_brand 
        AND p.equipment_type = p_equipment_type 
        AND p.equipment_model = p_equipment_model THEN 1
      WHEN p.equipment_brand = p_equipment_brand 
        AND p.equipment_type = p_equipment_type 
        AND p.equipment_model IS NULL THEN 2
      WHEN p.equipment_brand = p_equipment_brand 
        AND p.equipment_type IS NULL
        AND p.equipment_model IS NULL THEN 3
      ELSE 5
    END,
    p.name;
END;
$$;