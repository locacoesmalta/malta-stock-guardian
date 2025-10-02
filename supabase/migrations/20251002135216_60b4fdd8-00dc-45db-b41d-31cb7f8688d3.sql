-- Remove the confusing "Deny all public access" policy
-- This policy is misleading because other policies override it with OR logic
-- The remaining policies correctly restrict access:
-- - Users can only see their own profile
-- - Admins can see all profiles
DROP POLICY IF EXISTS "Deny all public access to profiles" ON public.profiles;

-- Ensure we have the correct restrictive policies in place
-- These policies already exist, but we're being explicit about the security model

-- Regular users can only view their own profile
-- (This policy should already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Authenticated users can view only their own profile'
  ) THEN
    CREATE POLICY "Authenticated users can view only their own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
  END IF;
END $$;

-- Admins can view all profiles for user management
-- (This policy should already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));
  END IF;
END $$;

-- Users can only update their own profile
-- (This policy should already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Authenticated users can update only their own profile'
  ) THEN
    CREATE POLICY "Authenticated users can update only their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;