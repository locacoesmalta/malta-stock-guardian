-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_name text,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas: apenas admins podem ver logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Política para inserir logs (qualquer usuário autenticado pode criar seu próprio log)
CREATE POLICY "Users can insert their own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Função para registrar ações automaticamente em produtos
CREATE OR REPLACE FUNCTION public.log_products_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_email text;
  v_user_name text;
BEGIN
  -- Buscar informações do usuário
  SELECT email, full_name INTO v_user_email, v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, new_data
    ) VALUES (
      auth.uid(), 
      v_user_email, 
      v_user_name,
      'INSERT',
      'products',
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, old_data, new_data
    ) VALUES (
      auth.uid(), 
      v_user_email, 
      v_user_name,
      'UPDATE',
      'products',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, old_data
    ) VALUES (
      auth.uid(), 
      v_user_email, 
      v_user_name,
      'DELETE',
      'products',
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger para produtos
DROP TRIGGER IF EXISTS products_audit_trigger ON public.products;
CREATE TRIGGER products_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.log_products_changes();

-- Função para registrar ações em retiradas de material
CREATE OR REPLACE FUNCTION public.log_withdrawals_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_email text;
  v_user_name text;
BEGIN
  SELECT email, full_name INTO v_user_email, v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, new_data
    ) VALUES (
      auth.uid(), 
      v_user_email, 
      v_user_name,
      'INSERT',
      'material_withdrawals',
      NEW.id,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, old_data
    ) VALUES (
      auth.uid(), 
      v_user_email, 
      v_user_name,
      'DELETE',
      'material_withdrawals',
      OLD.id,
      to_jsonb(OLD)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para retiradas
DROP TRIGGER IF EXISTS withdrawals_audit_trigger ON public.material_withdrawals;
CREATE TRIGGER withdrawals_audit_trigger
  AFTER INSERT OR DELETE ON public.material_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.log_withdrawals_changes();

-- Função para registrar ações em relatórios
CREATE OR REPLACE FUNCTION public.log_reports_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_email text;
  v_user_name text;
BEGIN
  SELECT email, full_name INTO v_user_email, v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, new_data
    ) VALUES (
      auth.uid(), 
      v_user_email, 
      v_user_name,
      'INSERT',
      'reports',
      NEW.id,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, old_data, new_data
    ) VALUES (
      auth.uid(), 
      v_user_email, 
      v_user_name,
      'UPDATE',
      'reports',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, old_data
    ) VALUES (
      auth.uid(), 
      v_user_email, 
      v_user_name,
      'DELETE',
      'reports',
      OLD.id,
      to_jsonb(OLD)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para relatórios
DROP TRIGGER IF EXISTS reports_audit_trigger ON public.reports;
CREATE TRIGGER reports_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.log_reports_changes();

-- Função para registrar ações em patrimônio
CREATE OR REPLACE FUNCTION public.log_assets_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_email text;
  v_user_name text;
BEGIN
  SELECT email, full_name INTO v_user_email, v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, new_data
    ) VALUES (
      auth.uid(), 
      v_user_email, 
      v_user_name,
      'INSERT',
      'assets',
      NEW.id,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, old_data, new_data
    ) VALUES (
      auth.uid(), 
      v_user_email, 
      v_user_name,
      'UPDATE',
      'assets',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, old_data
    ) VALUES (
      auth.uid(), 
      v_user_email, 
      v_user_name,
      'DELETE',
      'assets',
      OLD.id,
      to_jsonb(OLD)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para patrimônio
DROP TRIGGER IF EXISTS assets_audit_trigger ON public.assets;
CREATE TRIGGER assets_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.log_assets_changes();

-- Função para registrar alterações de permissões
CREATE OR REPLACE FUNCTION public.log_permissions_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_email text;
  v_user_name text;
BEGIN
  SELECT email, full_name INTO v_user_email, v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, old_data, new_data
    ) VALUES (
      auth.uid(), 
      v_user_email, 
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
$$;

-- Trigger para permissões
DROP TRIGGER IF EXISTS permissions_audit_trigger ON public.user_permissions;
CREATE TRIGGER permissions_audit_trigger
  AFTER UPDATE ON public.user_permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_permissions_changes();