-- Liberar TODAS as permissões para usuários ativos existentes
-- Mantém can_access_admin restrito a admins/superusers

UPDATE user_permissions
SET 
  can_access_main_menu = true,
  can_access_admin = CASE 
    WHEN user_id IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'superuser')
    ) THEN true
    ELSE can_access_admin
  END,
  can_view_products = true,
  can_edit_products = true,
  can_delete_products = true,
  can_create_withdrawals = true,
  can_view_withdrawal_history = true,
  can_access_assets = true,
  can_create_assets = true,
  can_edit_assets = true,
  can_delete_assets = true,
  can_scan_assets = true,
  can_create_reports = true,
  can_view_reports = true,
  can_edit_reports = true,
  can_delete_reports = true,
  can_view_financial_data = true
WHERE is_active = true;