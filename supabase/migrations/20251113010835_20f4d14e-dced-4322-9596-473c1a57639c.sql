-- Move pg_net extension from public to extensions schema
-- This resolves the security warning about extensions in public schema

-- Ensure extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_net extension (used for HTTP requests)
ALTER EXTENSION pg_net SET SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT USAGE ON SCHEMA extensions TO postgres;
GRANT ALL ON SCHEMA extensions TO postgres;

-- Update any functions that might use pg_net to include extensions in search_path
-- (pg_net is typically used in edge functions or background jobs, not in user functions)

COMMENT ON EXTENSION pg_net IS 'Extensão pg_net movida para schema extensions por questões de segurança';
