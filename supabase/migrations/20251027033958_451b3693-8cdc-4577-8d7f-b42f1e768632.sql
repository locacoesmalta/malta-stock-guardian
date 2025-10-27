-- ==========================================
-- TRIGGERS DE AUDITORIA - MALTA STOCK GUARDIAN
-- ==========================================
-- Ativa o sistema de logging automático para todas as operações

-- Trigger para tabela PRODUCTS
CREATE TRIGGER audit_products_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.log_products_changes();

-- Trigger para tabela REPORTS
CREATE TRIGGER audit_reports_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.log_reports_changes();

-- Trigger para tabela ASSETS
CREATE TRIGGER audit_assets_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_assets_changes();

-- Trigger para tabela MATERIAL_WITHDRAWALS
CREATE TRIGGER audit_withdrawals_changes
  AFTER INSERT OR DELETE ON public.material_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.log_withdrawals_changes();

-- Trigger para tabela EQUIPMENT_RECEIPTS
CREATE TRIGGER audit_receipts_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.equipment_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_receipts_changes();

-- Trigger para tabela USER_PERMISSIONS
CREATE TRIGGER audit_permissions_changes
  AFTER UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_permissions_changes();

-- Comentários explicativos
COMMENT ON TRIGGER audit_products_changes ON public.products IS 'Registra automaticamente todas as operações em produtos';
COMMENT ON TRIGGER audit_reports_changes ON public.reports IS 'Registra automaticamente todas as operações em relatórios';
COMMENT ON TRIGGER audit_assets_changes ON public.assets IS 'Registra automaticamente todas as operações em ativos';
COMMENT ON TRIGGER audit_withdrawals_changes ON public.material_withdrawals IS 'Registra automaticamente retiradas de material';
COMMENT ON TRIGGER audit_receipts_changes ON public.equipment_receipts IS 'Registra automaticamente operações em recibos';
COMMENT ON TRIGGER audit_permissions_changes ON public.user_permissions IS 'Registra automaticamente mudanças de permissões';