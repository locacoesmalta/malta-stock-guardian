-- Adicionar colunas para controle de acesso ao menu principal e administração
ALTER TABLE public.user_permissions 
ADD COLUMN IF NOT EXISTS can_access_main_menu boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_access_admin boolean DEFAULT false;

-- Atualizar administradores existentes para terem todas as permissões
UPDATE public.user_permissions 
SET 
  can_access_main_menu = true,
  can_access_admin = true,
  is_active = true,
  can_view_products = true,
  can_create_reports = true,
  can_view_reports = true
WHERE user_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
);

-- Atualizar a função handle_new_user para incluir as novas permissões
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- First user becomes admin, others are regular users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.user_roles) = 0 THEN 'admin'::app_role
      ELSE 'user'::app_role
    END
  );
  
  -- Create default permissions
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'admin') THEN
    -- Regular users: inactive by default
    INSERT INTO public.user_permissions (
      user_id, 
      is_active, 
      can_view_products, 
      can_create_reports, 
      can_view_reports,
      can_access_main_menu,
      can_access_admin
    )
    VALUES (NEW.id, false, false, false, false, false, false);
  ELSE
    -- Admins: all permissions active
    INSERT INTO public.user_permissions (
      user_id, 
      is_active, 
      can_view_products, 
      can_create_reports, 
      can_view_reports,
      can_access_main_menu,
      can_access_admin
    )
    VALUES (NEW.id, true, true, true, true, true, true);
  END IF;
  
  RETURN NEW;
END;
$function$;