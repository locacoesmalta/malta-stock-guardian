-- ============================================
-- FASE 3: FUNÇÕES DE VALIDAÇÃO DE INTEGRIDADE
-- ============================================

-- 1. Verificar assets com inconsistências de location_type
CREATE OR REPLACE FUNCTION check_assets_integrity()
RETURNS TABLE(
  asset_id uuid,
  asset_code text,
  equipment_name text,
  location_type text,
  issue_type text,
  details text
) AS $$
BEGIN
  RETURN QUERY
  -- Assets em manutenção mas sem dados de manutenção
  SELECT 
    a.id,
    a.asset_code,
    a.equipment_name,
    a.location_type,
    'missing_maintenance_data'::text,
    'Equipamento marcado como "em_manutencao" mas sem empresa/obra de manutenção'::text
  FROM assets a
  WHERE a.deleted_at IS NULL
    AND a.location_type = 'em_manutencao'
    AND (a.maintenance_company IS NULL OR TRIM(a.maintenance_company) = '')
  
  UNION ALL
  
  -- Assets locados mas sem dados de locação
  SELECT 
    a.id,
    a.asset_code,
    a.equipment_name,
    a.location_type,
    'missing_rental_data'::text,
    'Equipamento marcado como "locacao" mas sem empresa/obra de locação'::text
  FROM assets a
  WHERE a.deleted_at IS NULL
    AND a.location_type = 'locacao'
    AND (a.rental_company IS NULL OR TRIM(a.rental_company) = '')
  
  UNION ALL
  
  -- Assets com dados de manutenção mas não marcados como em manutenção
  SELECT 
    a.id,
    a.asset_code,
    a.equipment_name,
    a.location_type,
    'inconsistent_maintenance_status'::text,
    'Equipamento tem dados de manutenção mas location_type não é "em_manutencao"'::text
  FROM assets a
  WHERE a.deleted_at IS NULL
    AND a.location_type != 'em_manutencao'
    AND (
      (a.maintenance_company IS NOT NULL AND TRIM(a.maintenance_company) != '')
      OR (a.maintenance_work_site IS NOT NULL AND TRIM(a.maintenance_work_site) != '')
    )
  
  UNION ALL
  
  -- Assets com dados de locação mas não marcados como locados
  SELECT 
    a.id,
    a.asset_code,
    a.equipment_name,
    a.location_type,
    'inconsistent_rental_status'::text,
    'Equipamento tem dados de locação mas location_type não é "locacao"'::text
  FROM assets a
  WHERE a.deleted_at IS NULL
    AND a.location_type != 'locacao'
    AND (
      (a.rental_company IS NOT NULL AND TRIM(a.rental_company) != '')
      OR (a.rental_work_site IS NOT NULL AND TRIM(a.rental_work_site) != '')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Verificar retiradas de material com problemas
CREATE OR REPLACE FUNCTION check_withdrawals_integrity()
RETURNS TABLE(
  withdrawal_id uuid,
  product_code text,
  product_name text,
  equipment_code text,
  quantity integer,
  withdrawal_date date,
  issue_type text,
  details text
) AS $$
BEGIN
  RETURN QUERY
  -- Retiradas com produtos órfãos (produto deletado/não existe)
  SELECT 
    mw.id,
    COALESCE(p.code, 'N/A')::text,
    COALESCE(p.name, 'PRODUTO NÃO ENCONTRADO')::text,
    mw.equipment_code,
    mw.quantity,
    mw.withdrawal_date,
    'orphan_product'::text,
    'Retirada referencia produto que não existe ou foi deletado'::text
  FROM material_withdrawals mw
  LEFT JOIN products p ON mw.product_id = p.id
  WHERE p.id IS NULL OR p.deleted_at IS NOT NULL
  
  UNION ALL
  
  -- Retiradas com quantidade inválida
  SELECT 
    mw.id,
    p.code,
    p.name,
    mw.equipment_code,
    mw.quantity,
    mw.withdrawal_date,
    'invalid_quantity'::text,
    'Quantidade retirada é zero ou negativa'::text
  FROM material_withdrawals mw
  JOIN products p ON mw.product_id = p.id
  WHERE mw.quantity <= 0
  
  UNION ALL
  
  -- Retiradas marcadas como usadas em relatório que não existe
  SELECT 
    mw.id,
    p.code,
    p.name,
    mw.equipment_code,
    mw.quantity,
    mw.withdrawal_date,
    'orphan_report_reference'::text,
    'Retirada marcada como usada em relatório que não existe'::text
  FROM material_withdrawals mw
  JOIN products p ON mw.product_id = p.id
  LEFT JOIN reports r ON mw.used_in_report_id = r.id
  WHERE mw.used_in_report_id IS NOT NULL
    AND (r.id IS NULL OR r.deleted_at IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Verificar relatórios com problemas
CREATE OR REPLACE FUNCTION check_reports_integrity()
RETURNS TABLE(
  report_id uuid,
  report_date date,
  equipment_code text,
  work_site text,
  company text,
  issue_type text,
  details text
) AS $$
BEGIN
  RETURN QUERY
  -- Relatórios sem peças associadas
  SELECT 
    r.id,
    r.report_date,
    r.equipment_code,
    r.work_site,
    r.company,
    'no_parts'::text,
    'Relatório não possui peças vinculadas'::text
  FROM reports r
  WHERE r.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM report_parts rp WHERE rp.report_id = r.id
    )
  
  UNION ALL
  
  -- Relatórios com peças órfãs (produto não existe)
  SELECT 
    r.id,
    r.report_date,
    r.equipment_code,
    r.work_site,
    r.company,
    'orphan_parts'::text,
    'Relatório possui peças que referenciam produtos inexistentes'::text
  FROM reports r
  WHERE r.deleted_at IS NULL
    AND EXISTS (
      SELECT 1 
      FROM report_parts rp 
      LEFT JOIN products p ON rp.product_id = p.id
      WHERE rp.report_id = r.id 
        AND (p.id IS NULL OR p.deleted_at IS NOT NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verificar produtos com problemas de estoque
CREATE OR REPLACE FUNCTION check_products_stock_integrity()
RETURNS TABLE(
  product_id uuid,
  product_code text,
  product_name text,
  current_quantity integer,
  min_quantity integer,
  issue_type text,
  details text
) AS $$
BEGIN
  RETURN QUERY
  -- Produtos com estoque negativo
  SELECT 
    p.id,
    p.code,
    p.name,
    p.quantity,
    p.min_quantity,
    'negative_stock'::text,
    'Produto com estoque negativo'::text
  FROM products p
  WHERE p.deleted_at IS NULL
    AND p.quantity < 0
  
  UNION ALL
  
  -- Produtos com estoque abaixo do mínimo
  SELECT 
    p.id,
    p.code,
    p.name,
    p.quantity,
    p.min_quantity,
    'below_minimum'::text,
    'Estoque atual abaixo do estoque mínimo configurado'::text
  FROM products p
  WHERE p.deleted_at IS NULL
    AND p.quantity < p.min_quantity
    AND p.quantity >= 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON FUNCTION check_assets_integrity() IS 'Verifica inconsistências em equipamentos (location_type vs dados reais)';
COMMENT ON FUNCTION check_withdrawals_integrity() IS 'Verifica retiradas de material com problemas (produtos órfãos, quantidades inválidas)';
COMMENT ON FUNCTION check_reports_integrity() IS 'Verifica relatórios com problemas (sem peças, peças órfãs)';
COMMENT ON FUNCTION check_products_stock_integrity() IS 'Verifica produtos com estoque negativo ou abaixo do mínimo';