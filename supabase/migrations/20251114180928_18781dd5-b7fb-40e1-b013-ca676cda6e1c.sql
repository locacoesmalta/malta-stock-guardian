-- ================================
-- FASE 1: Conceder Permissões Financeiras aos Admins
-- ================================
UPDATE user_permissions
SET 
  can_view_financial_data = true,
  updated_at = NOW()
WHERE user_id IN (
  SELECT user_id FROM user_roles WHERE role IN ('admin', 'superuser')
);

-- ================================
-- FASE 3: Corrigir Search Path das Funções (Segurança)
-- ================================

-- Funções de permissões que precisam de search_path fixo
ALTER FUNCTION public.can_user_view_financial_data(uuid)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.can_user_view_products(uuid)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.can_user_create_reports(uuid)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.can_user_view_reports(uuid)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.can_user_create_withdrawals(uuid)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.can_user_edit_products(uuid)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.can_user_delete_products(uuid)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.can_user_edit_reports(uuid)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.can_user_delete_reports(uuid)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.can_user_access_assets(uuid)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.can_user_create_assets(uuid)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.can_user_edit_assets(uuid)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.can_user_delete_assets(uuid)
  SET search_path = pg_catalog, public;

-- ================================
-- FASE 5: Investigar Security Definer View
-- ================================
-- Criar função para auditar views com security definer
CREATE OR REPLACE FUNCTION public.audit_security_definer_views()
RETURNS TABLE(
  view_name text,
  view_owner text,
  security_level text,
  recommendation text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.viewname::text as view_name,
    v.viewowner::text as view_owner,
    'SECURITY DEFINER'::text as security_level,
    'Review if RLS bypass is intentional'::text as recommendation
  FROM pg_views v
  WHERE v.schemaname = 'public'
    AND v.definition ILIKE '%SECURITY DEFINER%';
END;
$$;