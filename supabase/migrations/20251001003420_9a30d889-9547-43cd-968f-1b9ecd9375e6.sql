-- Adicionar novas colunas de permissões granulares à tabela user_permissions
ALTER TABLE public.user_permissions
  ADD COLUMN IF NOT EXISTS can_create_withdrawals boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_withdrawal_history boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_edit_products boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_delete_products boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_edit_reports boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_delete_reports boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_access_assets boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_create_assets boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_edit_assets boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_delete_assets boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_scan_assets boolean DEFAULT false;

-- Atualizar permissões dos administradores existentes para terem todas as permissões
UPDATE public.user_permissions
SET 
  can_create_withdrawals = true,
  can_view_withdrawal_history = true,
  can_edit_products = true,
  can_delete_products = true,
  can_edit_reports = true,
  can_delete_reports = true,
  can_access_assets = true,
  can_create_assets = true,
  can_edit_assets = true,
  can_delete_assets = true,
  can_scan_assets = true,
  can_view_products = true,
  can_create_reports = true,
  can_view_reports = true,
  can_access_main_menu = true,
  can_access_admin = true,
  is_active = true
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
);

-- Criar funções helper para verificar permissões específicas
CREATE OR REPLACE FUNCTION public.can_user_create_withdrawals(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_create_withdrawals 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.can_user_edit_products(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_edit_products 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.can_user_delete_products(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_delete_products 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.can_user_edit_reports(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_edit_reports 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.can_user_delete_reports(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_delete_reports 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.can_user_access_assets(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_access_assets 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.can_user_create_assets(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_create_assets 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.can_user_edit_assets(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_edit_assets 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.can_user_delete_assets(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_delete_assets 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    false
  )
$$;