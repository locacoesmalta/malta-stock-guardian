-- Create security function to check if user can view reports
CREATE OR REPLACE FUNCTION public.can_user_view_reports(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    -- Admins can always view reports
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    -- Regular users need to be active and have permission
    (SELECT is_active AND can_view_reports 
     FROM public.user_permissions 
     WHERE user_id = _user_id)
  )
$function$;

-- Create security function to check if user can create reports
CREATE OR REPLACE FUNCTION public.can_user_create_reports(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    -- Admins can always create reports
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    -- Regular users need to be active and have permission
    (SELECT is_active AND can_create_reports 
     FROM public.user_permissions 
     WHERE user_id = _user_id)
  )
$function$;

-- ========================================
-- FIX REPORTS TABLE SECURITY
-- ========================================

-- Drop the insecure public access policy
DROP POLICY IF EXISTS "Everyone can view reports" ON public.reports;

-- Create secure policy: only authenticated users with permission can view reports
CREATE POLICY "Authenticated users with permission can view reports"
ON public.reports
FOR SELECT
TO authenticated
USING (can_user_view_reports(auth.uid()));

-- Update insert policy to use the new function
DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.reports;

CREATE POLICY "Authenticated users with permission can create reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by 
  AND can_user_create_reports(auth.uid())
);

-- Keep admin-only policies for update and delete (already secure)

-- ========================================
-- FIX REPORT_PHOTOS TABLE SECURITY
-- ========================================

-- Drop the insecure public access policy
DROP POLICY IF EXISTS "Everyone can view report photos" ON public.report_photos;

-- Create secure policy: only users who can view reports can see photos
CREATE POLICY "Authenticated users with permission can view report photos"
ON public.report_photos
FOR SELECT
TO authenticated
USING (
  can_user_view_reports(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.reports 
    WHERE reports.id = report_photos.report_id
  )
);

-- Update insert policy
DROP POLICY IF EXISTS "Authenticated users can insert report photos" ON public.report_photos;

CREATE POLICY "Authenticated users with permission can insert report photos"
ON public.report_photos
FOR INSERT
TO authenticated
WITH CHECK (
  can_user_create_reports(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.reports 
    WHERE reports.id = report_photos.report_id 
    AND reports.created_by = auth.uid()
  )
);

-- ========================================
-- FIX REPORT_PARTS TABLE SECURITY
-- ========================================

-- Drop the insecure public access policy
DROP POLICY IF EXISTS "Everyone can view report parts" ON public.report_parts;

-- Create secure policy: only users who can view reports can see parts
CREATE POLICY "Authenticated users with permission can view report parts"
ON public.report_parts
FOR SELECT
TO authenticated
USING (
  can_user_view_reports(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.reports 
    WHERE reports.id = report_parts.report_id
  )
);

-- Update insert policy
DROP POLICY IF EXISTS "Authenticated users can create report parts" ON public.report_parts;

CREATE POLICY "Authenticated users with permission can create report parts"
ON public.report_parts
FOR INSERT
TO authenticated
WITH CHECK (
  can_user_create_reports(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.reports 
    WHERE reports.id = report_parts.report_id 
    AND reports.created_by = auth.uid()
  )
);