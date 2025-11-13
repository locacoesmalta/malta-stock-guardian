-- Corrigir Security Definer View
-- Recriar a view sem SECURITY DEFINER (usar security_invoker para forçar contexto do usuário)
DROP VIEW IF EXISTS public.audit_logs_integrity_status;

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
ORDER BY created_at DESC;

-- Adicionar RLS na view (apenas admins podem ver)
CREATE POLICY "Only admins can view integrity status"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  is_admin_or_superuser(auth.uid()) AND 
  id IN (SELECT id FROM public.audit_logs_integrity_status)
);