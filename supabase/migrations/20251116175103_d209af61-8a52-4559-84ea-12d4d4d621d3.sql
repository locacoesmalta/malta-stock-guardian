-- RPC para buscar último contexto usado em um PAT (empresa, obra, técnico, peças mais usadas)
CREATE OR REPLACE FUNCTION get_asset_last_context(p_equipment_code TEXT)
RETURNS TABLE (
  last_company TEXT,
  last_work_site TEXT,
  last_technician TEXT,
  top_products JSONB,
  pending_parts_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Buscar último relatório do PAT
  RETURN QUERY
  WITH last_report AS (
    SELECT 
      r.company,
      r.work_site,
      r.technician_name,
      r.report_date
    FROM reports r
    WHERE r.equipment_code = p_equipment_code
      AND r.deleted_at IS NULL
    ORDER BY r.report_date DESC, r.created_at DESC
    LIMIT 1
  ),
  top_parts AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'product_id', rp.product_id,
        'product_name', p.name,
        'product_code', p.code,
        'usage_count', part_usage.usage_count
      )
      ORDER BY part_usage.usage_count DESC
    ) as products
    FROM (
      SELECT 
        rp.product_id,
        COUNT(*) as usage_count
      FROM report_parts rp
      INNER JOIN reports r ON r.id = rp.report_id
      WHERE r.equipment_code = p_equipment_code
        AND r.deleted_at IS NULL
      GROUP BY rp.product_id
      ORDER BY COUNT(*) DESC
      LIMIT 5
    ) part_usage
    INNER JOIN products p ON p.id = part_usage.product_id
  ),
  pending_count AS (
    SELECT COUNT(*)::INTEGER as count
    FROM v_withdrawals_with_remaining v
    WHERE v.equipment_code = p_equipment_code
      AND v.is_archived = false
      AND v.remaining_quantity > 0
  )
  SELECT 
    lr.company,
    lr.work_site,
    lr.technician_name,
    COALESCE(tp.products, '[]'::jsonb),
    COALESCE(pc.count, 0)
  FROM last_report lr
  CROSS JOIN top_parts tp
  CROSS JOIN pending_count pc;
END;
$$;

-- Criar índices para otimizar a query
CREATE INDEX IF NOT EXISTS idx_reports_equipment_code_date 
  ON reports(equipment_code, report_date DESC, created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_report_parts_product_id 
  ON report_parts(product_id);

CREATE INDEX IF NOT EXISTS idx_withdrawals_equipment_pending
  ON material_withdrawals(equipment_code, is_archived, used_in_report_id)
  WHERE is_archived = false AND used_in_report_id IS NULL;

COMMENT ON FUNCTION get_asset_last_context IS 'Retorna contexto do último uso de um equipamento: empresa, obra, técnico e peças mais usadas. Usado para auto-preenchimento inteligente.';
