-- Create security functions to check permissions
CREATE OR REPLACE FUNCTION public.can_user_view_reports(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_view_reports 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    false
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_user_create_reports(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_create_reports 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    false
  )
$function$;

-- ========================================
-- REPORTS TABLE - Remove all existing policies and create secure ones
-- ========================================
DO $$ 
BEGIN
    -- Drop all existing policies on reports table
    DROP POLICY IF EXISTS "Everyone can view reports" ON public.reports;
    DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.reports;
    DROP POLICY IF EXISTS "Authenticated users with permission can view reports" ON public.reports;
    DROP POLICY IF EXISTS "Authenticated users with permission can create reports" ON public.reports;
END $$;

CREATE POLICY "Authenticated users with permission can view reports"
ON public.reports
FOR SELECT
TO authenticated
USING (can_user_view_reports(auth.uid()));

CREATE POLICY "Authenticated users with permission can create reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by 
  AND can_user_create_reports(auth.uid())
);

-- ========================================
-- REPORT_PHOTOS TABLE - Remove all existing policies and create secure ones
-- ========================================
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Everyone can view report photos" ON public.report_photos;
    DROP POLICY IF EXISTS "Authenticated users can insert report photos" ON public.report_photos;
    DROP POLICY IF EXISTS "Authenticated users with permission can view report photos" ON public.report_photos;
    DROP POLICY IF EXISTS "Authenticated users with permission can insert report photos" ON public.report_photos;
END $$;

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
-- REPORT_PARTS TABLE - Remove all existing policies and create secure ones
-- ========================================
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Everyone can view report parts" ON public.report_parts;
    DROP POLICY IF EXISTS "Authenticated users can create report parts" ON public.report_parts;
    DROP POLICY IF EXISTS "Authenticated users with permission can view report parts" ON public.report_parts;
    DROP POLICY IF EXISTS "Authenticated users with permission can create report parts" ON public.report_parts;
END $$;

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