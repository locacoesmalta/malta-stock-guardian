-- ============================================================================
-- FASE 1: SEGURANÇA - Acesso Exclusivo ao System Owner
-- ============================================================================

-- 1. Criar função que identifica o owner do sistema (walterknothead@gmail.com)
CREATE OR REPLACE FUNCTION public.is_system_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id 
    AND email = 'walterknothead@gmail.com'
  )
$$;

-- 2. Atualizar RLS policies de user_roles para permitir modificação APENAS pelo owner
DROP POLICY IF EXISTS "Only admins can assign roles" ON public.user_roles;

CREATE POLICY "Only system owner can assign roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_system_owner(auth.uid()))
WITH CHECK (public.is_system_owner(auth.uid()));

-- 3. Atualizar RLS policies de user_permissions para permitir modificação APENAS pelo owner
DROP POLICY IF EXISTS "Admins can update any user permissions" ON public.user_permissions;

CREATE POLICY "Only system owner can update user permissions"
ON public.user_permissions
FOR UPDATE
TO authenticated
USING (public.is_system_owner(auth.uid()))
WITH CHECK (public.is_system_owner(auth.uid()));

CREATE POLICY "Only system owner can insert user permissions"
ON public.user_permissions
FOR INSERT
TO authenticated
WITH CHECK (public.is_system_owner(auth.uid()));

-- 4. Prevenir que owner se auto-rebaixe ou desative (safety trigger)
CREATE OR REPLACE FUNCTION public.prevent_owner_self_demotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se está tentando remover role de admin do owner
  IF OLD.role = 'admin' AND NEW.role != 'admin' AND public.is_system_owner(OLD.user_id) THEN
    RAISE EXCEPTION 'System owner cannot be demoted from admin role';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_owner_demotion_trigger
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_owner_self_demotion();

-- 5. Prevenir desativação do owner
CREATE OR REPLACE FUNCTION public.prevent_owner_deactivation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se está tentando desativar o owner
  IF NEW.is_active = false AND public.is_system_owner(NEW.user_id) THEN
    RAISE EXCEPTION 'System owner cannot be deactivated';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_owner_deactivation_trigger
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_owner_deactivation();

-- 6. Comentários de documentação
COMMENT ON FUNCTION public.is_system_owner IS 'Verifica se o user_id corresponde ao email do system owner (walterknothead@gmail.com). SECURITY DEFINER para evitar bypass.';
COMMENT ON POLICY "Only system owner can assign roles" ON public.user_roles IS 'Apenas o system owner pode criar/modificar/deletar roles de usuários.';
COMMENT ON POLICY "Only system owner can update user permissions" ON public.user_permissions IS 'Apenas o system owner pode atualizar permissões de usuários.';