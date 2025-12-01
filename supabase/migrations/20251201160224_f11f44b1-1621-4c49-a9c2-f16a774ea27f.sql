-- ============================================
-- FASE 3C: PROTEGER VIEW AUDIT_LOGS_INTEGRITY_STATUS
-- ============================================
ALTER VIEW audit_logs_integrity_status SET (security_invoker = true);