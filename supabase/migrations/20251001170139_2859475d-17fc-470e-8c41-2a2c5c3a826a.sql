-- Tornar user_id nullable em audit_logs para permitir operações do sistema
ALTER TABLE public.audit_logs 
ALTER COLUMN user_id DROP NOT NULL;

-- Atualizar função de log de permissões para aceitar user_id NULL
CREATE OR REPLACE FUNCTION public.log_permissions_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_email text;
  v_user_name text;
  v_user_id uuid;
BEGIN
  -- Tenta pegar o user_id da sessão, se não existir usa NULL (operação system)
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM public.profiles
    WHERE id = v_user_id;
  ELSE
    v_user_email := 'system';
    v_user_name := 'System Operation';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, old_data, new_data
    ) VALUES (
      v_user_id, 
      COALESCE(v_user_email, 'system'), 
      v_user_name,
      'UPDATE',
      'user_permissions',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  RETURN NEW;
END;
$function$;