
-- Corrigir função sign_audit_log para usar extensão pgcrypto corretamente
CREATE OR REPLACE FUNCTION public.sign_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
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
  
  NEW.signature := encode(
    hmac(v_data_to_sign::bytea, v_signing_key::bytea, 'sha256'::text),
    'hex'
  );
  
  RETURN NEW;
END;
$function$;
