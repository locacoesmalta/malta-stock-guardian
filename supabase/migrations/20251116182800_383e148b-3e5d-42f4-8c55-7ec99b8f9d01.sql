-- Fix alias error in get_asset_last_context RPC
-- Drop and recreate with correct alias

DROP FUNCTION IF EXISTS get_asset_last_context(text);

CREATE FUNCTION get_asset_last_context(p_equipment_code text)
RETURNS TABLE (
  last_company text,
  last_work_site text,
  last_technician text,
  top_products jsonb,
  pending_parts_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH latest_report AS (
    SELECT company, work_site, technician_name
    FROM reports
    WHERE equipment_code = p_equipment_code 
      AND deleted_at IS NULL
    ORDER BY report_date DESC, created_at DESC
    LIMIT 1
  ),
  pending_parts AS (
    SELECT COUNT(*) as count
    FROM material_withdrawals
    WHERE equipment_code = p_equipment_code
      AND used_in_report_id IS NULL
      AND is_archived = false
  ),
  part_usage AS (
    SELECT 
      rp.product_id,
      p.name as product_name,
      p.code as product_code,
      COUNT(*) as usage_count
    FROM report_parts rp
    JOIN reports r ON r.id = rp.report_id
    JOIN products p ON p.id = rp.product_id
    WHERE r.equipment_code = p_equipment_code
      AND r.deleted_at IS NULL
    GROUP BY rp.product_id, p.name, p.code
    ORDER BY COUNT(*) DESC
    LIMIT 5
  )
  SELECT 
    lr.company,
    lr.work_site,
    lr.technician_name,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'product_id', part_usage.product_id,
        'product_name', part_usage.product_name,
        'product_code', part_usage.product_code,
        'usage_count', part_usage.usage_count
      ))
      FROM part_usage),
      '[]'::jsonb
    ) as top_products,
    pp.count as pending_parts_count
  FROM latest_report lr
  CROSS JOIN pending_parts pp;
END;
$$;