-- ============================================
-- CORREÇÃO CRÍTICA: HMAC Type Casting em Audit Logs
-- ============================================
-- Problema: hmac() interpretava 'sha256' como tipo unknown
-- Solução: Adicionar ::text explícito ao algoritmo
-- Impacto: Restabelece movimentação de ativos e audit logs

CREATE OR REPLACE FUNCTION public.sign_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_data_to_sign TEXT;
  v_signing_key TEXT;
BEGIN
  v_signing_key := 'malta-audit-signing-key-2025';
  
  v_data_to_sign := CONCAT(
    COALESCE(NEW.id::TEXT, ''),
    COALESCE(NEW.user_id::TEXT, ''),
    COALESCE(NEW.action, ''),
    COALESCE(NEW.table_name, ''),
    COALESCE(NEW.record_id::TEXT, ''),
    COALESCE(NEW.created_at::TEXT, '')
  );
  
  -- CORREÇÃO: Adicionar ::text ao terceiro argumento para resolver erro de tipo unknown
  NEW.signature := encode(
    hmac(v_data_to_sign::bytea, v_signing_key::bytea, 'sha256'::text),
    'hex'
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_audit_log_signature(p_log_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_log RECORD;
  v_computed_signature TEXT;
  v_signing_key TEXT;
  v_data_to_sign TEXT;
BEGIN
  SELECT * INTO v_log FROM public.audit_logs WHERE id = p_log_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  v_signing_key := 'malta-audit-signing-key-2025';
  
  v_data_to_sign := CONCAT(
    COALESCE(v_log.id::TEXT, ''),
    COALESCE(v_log.user_id::TEXT, ''),
    COALESCE(v_log.action, ''),
    COALESCE(v_log.table_name, ''),
    COALESCE(v_log.record_id::TEXT, ''),
    COALESCE(v_log.created_at::TEXT, '')
  );
  
  -- CORREÇÃO: Adicionar ::text ao terceiro argumento para resolver erro de tipo unknown
  v_computed_signature := encode(
    hmac(v_data_to_sign::bytea, v_signing_key::bytea, 'sha256'::text),
    'hex'
  );
  
  RETURN v_log.signature = v_computed_signature;
END;
$$;

-- Documentar correção no banco de dados
COMMENT ON FUNCTION public.sign_audit_log() IS 
'Assina audit logs com HMAC-SHA256. CORRIGIDO em 2025-11-13: Casting explícito ::text no algoritmo para resolver erro de tipo unknown.';

COMMENT ON FUNCTION public.verify_audit_log_signature(UUID) IS 
'Verifica integridade de assinatura HMAC. CORRIGIDO em 2025-11-13: Casting explícito ::text no algoritmo para resolver erro de tipo unknown.';