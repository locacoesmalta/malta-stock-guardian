-- =====================================================
-- SECURITY REMEDIATION: User Permissions & Profiles
-- =====================================================
-- This migration strengthens RLS policies to prevent
-- unauthorized access to security-critical user data
-- =====================================================

-- 1. STRENGTHEN user_permissions TABLE SECURITY
-- =====================================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Only admins can manage permissions" ON public.user_permissions;

-- Create restrictive policies with explicit access controls
-- Users can ONLY view their own permissions (no one else's)
CREATE POLICY "Users can view only their own permissions"
  ON public.user_permissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only admins can view all permissions (for management)
CREATE POLICY "Admins can view all permissions"
  ON public.user_permissions
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Only admins can insert new permission records
CREATE POLICY "Admins can insert permissions"
  ON public.user_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Only admins can update permission records
CREATE POLICY "Admins can update permissions"
  ON public.user_permissions
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Only admins can delete permission records
CREATE POLICY "Admins can delete permissions"
  ON public.user_permissions
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- 2. STRENGTHEN profiles TABLE SECURITY
-- =====================================================
-- Add explicit public access denial
CREATE POLICY "Deny all public access to profiles"
  ON public.profiles
  FOR ALL
  TO anon
  USING (false);

-- Ensure authenticated users can only access their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate with explicit restrictions
CREATE POLICY "Authenticated users can view only their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update only their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles (for user management)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- 3. ADD SECURITY DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.user_permissions IS 'Security-critical table containing user access rights. Access is restricted to self-view for regular users and full management for admins only. Any changes to policies should be reviewed for privilege escalation risks.';

COMMENT ON TABLE public.profiles IS 'Contains personal user information. Access is strictly limited to the owning user and admins. Public access is explicitly denied to prevent information disclosure.';