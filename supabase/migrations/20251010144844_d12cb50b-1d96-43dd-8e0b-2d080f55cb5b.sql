-- Garantir que pgcrypto está habilitado e acessível
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Recriar a função com o search_path correto incluindo extensions
CREATE OR REPLACE FUNCTION public.generate_audit_log_hash(
  p_user_id uuid, 
  p_action text, 
  p_table_name text, 
  p_record_id uuid, 
  p_timestamp timestamp with time zone
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  -- Gera um hash simples baseado nos dados principais
  RETURN encode(
    digest(
      COALESCE(p_user_id::text, '') || 
      COALESCE(p_action, '') || 
      COALESCE(p_table_name, '') || 
      COALESCE(p_record_id::text, '') || 
      COALESCE(p_timestamp::text, ''),
      'sha256'
    ),
    'hex'
  );
END;
$$;