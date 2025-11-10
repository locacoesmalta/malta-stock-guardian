-- ============================================
-- CORREÇÃO: Roles Duplicadas e Privilégios Superuser
-- ============================================

-- 1. LIMPAR ROLES DUPLICADAS (manter apenas a mais alta)
-- Prioridade: admin > superuser > user
WITH duplicates AS (
  SELECT user_id, 
         array_agg(id ORDER BY 
           CASE role 
             WHEN 'admin' THEN 1 
             WHEN 'superuser' THEN 2 
             ELSE 3 
           END
         ) as ids
  FROM public.user_roles
  GROUP BY user_id
  HAVING COUNT(*) > 1
)
DELETE FROM public.user_roles 
WHERE id IN (
  SELECT unnest(ids[2:]) FROM duplicates
);

-- 2. ADICIONAR CONSTRAINT para garantir UMA role por usuário
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_unique;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- 3. CRIAR FUNÇÃO HELPER para admin OU superuser
CREATE OR REPLACE FUNCTION public.is_admin_or_superuser(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'superuser')
  )
$$;

COMMENT ON FUNCTION public.is_admin_or_superuser IS 
'Verifica se usuário é admin OU superuser (privilégios elevados)';

-- 4. ATUALIZAR RLS POLICIES para incluir superusers

-- Audit Logs - Permitir superusers verem logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins and superusers can view audit logs"
ON public.audit_logs
FOR SELECT
USING (is_admin_or_superuser(auth.uid()));

-- Reports - Permitir superusers editarem/deletarem
DROP POLICY IF EXISTS "Users with permission can delete reports" ON public.reports;
CREATE POLICY "Users with permission can delete reports"
ON public.reports
FOR DELETE
USING (can_user_delete_reports(auth.uid()) OR is_admin_or_superuser(auth.uid()));

DROP POLICY IF EXISTS "Users with permission can update reports" ON public.reports;
CREATE POLICY "Users with permission can update reports"
ON public.reports
FOR UPDATE
USING (can_user_edit_reports(auth.uid()) OR is_admin_or_superuser(auth.uid()))
WITH CHECK (can_user_edit_reports(auth.uid()) OR is_admin_or_superuser(auth.uid()));

-- Material Withdrawals - Permitir superusers deletarem
DROP POLICY IF EXISTS "Only admins can delete withdrawals" ON public.material_withdrawals;
CREATE POLICY "Admins and superusers can delete withdrawals"
ON public.material_withdrawals
FOR DELETE
USING (is_admin_or_superuser(auth.uid()));

-- Equipment Receipts - Permitir superusers deletarem
DROP POLICY IF EXISTS "Users with permission can delete receipts" ON public.equipment_receipts;
CREATE POLICY "Users with permission can delete receipts"
ON public.equipment_receipts
FOR DELETE
USING (can_user_delete_reports(auth.uid()) OR is_admin_or_superuser(auth.uid()));

-- Rental Companies - Permitir superusers gerenciarem
DROP POLICY IF EXISTS "Only admins can delete rental companies" ON public.rental_companies;
CREATE POLICY "Admins and superusers can delete rental companies"
ON public.rental_companies
FOR DELETE
USING (is_admin_or_superuser(auth.uid()));

DROP POLICY IF EXISTS "Only admins can insert rental companies" ON public.rental_companies;
CREATE POLICY "Admins and superusers can insert rental companies"
ON public.rental_companies
FOR INSERT
WITH CHECK (is_admin_or_superuser(auth.uid()));

DROP POLICY IF EXISTS "Only admins can update rental companies" ON public.rental_companies;
CREATE POLICY "Admins and superusers can update rental companies"
ON public.rental_companies
FOR UPDATE
USING (is_admin_or_superuser(auth.uid()))
WITH CHECK (is_admin_or_superuser(auth.uid()));

DROP POLICY IF EXISTS "Only admins can view rental companies" ON public.rental_companies;
CREATE POLICY "Admins and superusers can view rental companies"
ON public.rental_companies
FOR SELECT
USING (is_admin_or_superuser(auth.uid()));

-- Rental Equipment - Permitir superusers gerenciarem
DROP POLICY IF EXISTS "Only admins can delete rental equipment" ON public.rental_equipment;
CREATE POLICY "Admins and superusers can delete rental equipment"
ON public.rental_equipment
FOR DELETE
USING (is_admin_or_superuser(auth.uid()));

DROP POLICY IF EXISTS "Only admins can insert rental equipment" ON public.rental_equipment;
CREATE POLICY "Admins and superusers can insert rental equipment"
ON public.rental_equipment
FOR INSERT
WITH CHECK (is_admin_or_superuser(auth.uid()));

DROP POLICY IF EXISTS "Only admins can update rental equipment" ON public.rental_equipment;
CREATE POLICY "Admins and superusers can update rental equipment"
ON public.rental_equipment
FOR UPDATE
USING (is_admin_or_superuser(auth.uid()))
WITH CHECK (is_admin_or_superuser(auth.uid()));

DROP POLICY IF EXISTS "Only admins can view rental equipment" ON public.rental_equipment;
CREATE POLICY "Admins and superusers can view rental equipment"
ON public.rental_equipment
FOR SELECT
USING (is_admin_or_superuser(auth.uid()));