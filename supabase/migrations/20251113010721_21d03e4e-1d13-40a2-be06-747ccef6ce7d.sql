-- Move extensions from public schema to extensions schema
-- This fixes the security warning about extensions in public schema

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pgcrypto extension (used for digest function in audit logs)
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Update search_path in functions that use extensions
-- Update generate_audit_log_hash function to use extensions schema
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
    extensions.digest(
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

-- Grant usage on extensions schema to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Comment explaining the change
COMMENT ON SCHEMA extensions IS 'Schema para extensões PostgreSQL seguindo melhores práticas de segurança Supabase';
