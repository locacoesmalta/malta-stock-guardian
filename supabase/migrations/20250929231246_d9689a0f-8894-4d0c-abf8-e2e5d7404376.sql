-- Add active status to user_permissions table
ALTER TABLE public.user_permissions
ADD COLUMN is_active boolean DEFAULT false;

-- Update existing users to be active (except admins who are always active)
UPDATE public.user_permissions
SET is_active = true;

-- Update the handle_new_user function to create users as inactive by default
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
  
  -- Create default permissions for regular users (inactive by default)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'admin') THEN
    INSERT INTO public.user_permissions (user_id, is_active, can_view_products, can_create_reports, can_view_reports)
    VALUES (NEW.id, false, false, false, false);
  ELSE
    -- Admins are always active
    INSERT INTO public.user_permissions (user_id, is_active, can_view_products, can_create_reports, can_view_reports)
    VALUES (NEW.id, true, true, true, true);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create function to check if user is active
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT is_active FROM public.user_permissions WHERE user_id = _user_id),
    (SELECT true FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
  )
$function$;