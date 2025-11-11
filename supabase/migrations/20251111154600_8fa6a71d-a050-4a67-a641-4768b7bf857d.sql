-- Recriar view com SECURITY INVOKER para usar permissões do usuário consultante
DROP VIEW IF EXISTS v_withdrawals_with_remaining;

CREATE VIEW v_withdrawals_with_remaining 
WITH (security_invoker = true) AS
SELECT 
  mw.id,
  mw.product_id,
  mw.quantity,
  mw.withdrawal_date,
  mw.withdrawal_reason,
  mw.equipment_code,
  mw.work_site,
  mw.company,
  mw.lifecycle_cycle,
  mw.is_archived,
  mw.withdrawn_by,
  mw.created_at,
  mw.used_in_report_id,
  COALESCE(
    mw.quantity - COALESCE(SUM(rp.quantity_used), 0), 
    mw.quantity
  ) AS remaining_quantity
FROM material_withdrawals mw
LEFT JOIN report_parts rp ON rp.withdrawal_id = mw.id
WHERE mw.is_archived = false
GROUP BY mw.id, mw.product_id, mw.quantity, mw.withdrawal_date, mw.withdrawal_reason, 
         mw.equipment_code, mw.work_site, mw.company, mw.lifecycle_cycle, 
         mw.is_archived, mw.withdrawn_by, mw.created_at, mw.used_in_report_id;