-- ============================================
-- FASE 2B: ADICIONAR RLS APENAS ÀS VIEWS EXISTENTES
-- ============================================
ALTER VIEW v_withdrawals_with_remaining SET (security_invoker = true);