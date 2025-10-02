-- Atualizar todos os usuários existentes (não-admin) para ter acesso total
-- Isso garante que todos os usuários já criados recebam as permissões completas

UPDATE public.user_permissions
SET 
  is_active = true,
  can_access_main_menu = true,
  can_access_admin = true,
  can_view_products = true,
  can_create_reports = true,
  can_view_reports = true,
  can_create_withdrawals = true,
  can_view_withdrawal_history = true,
  can_edit_products = true,
  can_delete_products = true,
  can_edit_reports = true,
  can_delete_reports = true,
  can_access_assets = true,
  can_create_assets = true,
  can_edit_assets = true,
  can_delete_assets = true,
  can_scan_assets = true,
  updated_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users
);