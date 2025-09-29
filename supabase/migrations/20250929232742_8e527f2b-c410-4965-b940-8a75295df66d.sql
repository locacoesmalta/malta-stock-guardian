-- ============================================
-- PHASE 1: SECURITY FIXES FOR DATA PROTECTION
-- ============================================

-- 1. Create function to check if user can view products
CREATE OR REPLACE FUNCTION public.can_user_view_products(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_view_products 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    false
  )
$$;

-- 2. SECURE PRODUCTS TABLE
-- Drop all existing policies first
DROP POLICY IF EXISTS "Everyone can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users with permission can view products" ON public.products;

-- Create secure policy for viewing products
CREATE POLICY "Authenticated users with permission can view products"
ON public.products
FOR SELECT
TO authenticated
USING (can_user_view_products(auth.uid()));

-- 3. SECURE MATERIAL WITHDRAWALS TABLE
-- Drop all existing policies first
DROP POLICY IF EXISTS "Everyone can view withdrawals" ON public.material_withdrawals;
DROP POLICY IF EXISTS "Authenticated users can view withdrawals" ON public.material_withdrawals;

-- Create secure policy for viewing withdrawals
CREATE POLICY "Authenticated users can view withdrawals"
ON public.material_withdrawals
FOR SELECT
TO authenticated
USING (is_user_active(auth.uid()));

-- 4. SECURE STORAGE BUCKET
-- Change report-photos bucket from public to private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'report-photos';

-- Drop all existing storage policies first
DROP POLICY IF EXISTS "Public can view report photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload report photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users with permission can view report photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users with permission can upload report photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users with permission can update report photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete report photos" ON storage.objects;

-- Create secure storage policies for report-photos bucket
CREATE POLICY "Authenticated users with permission can view report photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'report-photos' 
  AND can_user_view_reports(auth.uid())
);

CREATE POLICY "Authenticated users with permission can upload report photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'report-photos' 
  AND can_user_create_reports(auth.uid())
);

CREATE POLICY "Authenticated users with permission can update report photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'report-photos' 
  AND can_user_create_reports(auth.uid())
);

CREATE POLICY "Admins can delete report photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'report-photos' 
  AND is_admin(auth.uid())
);

-- ============================================
-- PHASE 2: ENHANCED SECURITY CONFIGURATION
-- ============================================

-- 5. Fix function search paths for security best practices
CREATE OR REPLACE FUNCTION public.can_user_view_reports(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_view_reports 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.can_user_create_reports(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_create_reports 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    false
  )
$$;