-- Move pg_net extension from public to extensions schema
-- This completes the fix for the "Extension in Public" security warning

-- Drop and recreate pg_net in the correct schema
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Ensure all extensions are in the extensions schema
COMMENT ON EXTENSION pg_net IS 'Async HTTP client for PostgreSQL - moved to extensions schema for security compliance';

-- Verify no extensions remain in public schema
DO $$
DECLARE
  ext_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ext_count
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE n.nspname = 'public';
  
  IF ext_count > 0 THEN
    RAISE WARNING 'Still % extension(s) in public schema', ext_count;
  ELSE
    RAISE NOTICE 'All extensions successfully moved from public schema';
  END IF;
END $$;
