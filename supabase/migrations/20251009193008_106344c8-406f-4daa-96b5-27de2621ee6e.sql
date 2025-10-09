-- Drop existing overly permissive policies on rental_companies
DROP POLICY IF EXISTS "Users with permission can view rental companies" ON public.rental_companies;
DROP POLICY IF EXISTS "Users with permission can insert rental companies" ON public.rental_companies;
DROP POLICY IF EXISTS "Users with permission can update rental companies" ON public.rental_companies;
DROP POLICY IF EXISTS "Users with permission can delete rental companies" ON public.rental_companies;

-- Create stricter admin-only policies for rental_companies
-- Only admins can view rental company details (including sensitive contact info)
CREATE POLICY "Only admins can view rental companies"
ON public.rental_companies
FOR SELECT
USING (is_admin(auth.uid()));

-- Only admins can insert rental companies
CREATE POLICY "Only admins can insert rental companies"
ON public.rental_companies
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Only admins can update rental companies
CREATE POLICY "Only admins can update rental companies"
ON public.rental_companies
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Only admins can delete rental companies
CREATE POLICY "Only admins can delete rental companies"
ON public.rental_companies
FOR DELETE
USING (is_admin(auth.uid()));