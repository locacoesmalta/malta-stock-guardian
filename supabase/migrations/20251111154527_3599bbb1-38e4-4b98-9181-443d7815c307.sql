-- Criar view que calcula remaining_quantity diretamente no banco
CREATE OR REPLACE VIEW v_withdrawals_with_remaining AS
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

-- Criar índices para otimizar queries
CREATE INDEX IF NOT EXISTS idx_material_withdrawals_equipment_code 
  ON material_withdrawals(equipment_code) WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_report_parts_withdrawal_id 
  ON report_parts(withdrawal_id);

CREATE INDEX IF NOT EXISTS idx_material_withdrawals_archived 
  ON material_withdrawals(is_archived);