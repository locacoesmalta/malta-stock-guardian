-- Corrigir alerta de Security Definer View (com CASCADE)

DROP VIEW IF EXISTS public.audit_logs_integrity_status CASCADE;

CREATE VIEW public.audit_logs_integrity_status 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_email,
  action,
  table_name,
  created_at,
  signature IS NOT NULL as has_signature,
  CASE 
    WHEN signature IS NULL THEN 'NO_SIGNATURE'
    WHEN verify_audit_log_signature(id) THEN 'VALID'
    ELSE 'COMPROMISED'
  END as integrity_status
FROM public.audit_logs
WHERE is_admin_or_superuser(auth.uid())
ORDER BY created_at DESC;