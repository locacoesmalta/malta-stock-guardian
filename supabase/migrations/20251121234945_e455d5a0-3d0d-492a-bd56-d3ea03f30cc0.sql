-- Migration: Remover triggers duplicados de auditoria
-- Problema: Cada ação estava sendo registrada 2x no audit_logs devido a triggers duplicados
-- Solução: Manter apenas 1 trigger por tabela (os triggers com prefixo log_*)

-- PRODUCTS: remover trigger duplicado
DROP TRIGGER IF EXISTS products_audit_trigger ON public.products;

-- REPORTS: remover trigger duplicado  
DROP TRIGGER IF EXISTS reports_audit_trigger ON public.reports;

-- ASSETS: remover trigger duplicado
DROP TRIGGER IF EXISTS assets_audit_trigger ON public.assets;

-- MATERIAL_WITHDRAWALS: remover trigger duplicado (se existir)
DROP TRIGGER IF EXISTS withdrawals_audit_trigger ON public.material_withdrawals;

-- EQUIPMENT_RECEIPTS: remover trigger duplicado (se existir)
DROP TRIGGER IF EXISTS receipts_audit_trigger ON public.equipment_receipts;

-- Comentário: 
-- Os triggers mantidos são: log_products_changes, log_reports_changes, log_assets_changes, 
-- log_withdrawals_changes, log_receipts_changes
-- Estes são os triggers corretos que devem permanecer ativos para auditoria