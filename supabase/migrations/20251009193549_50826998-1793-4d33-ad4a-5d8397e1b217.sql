-- =====================================================
-- CORREÇÕES DE SEGURANÇA PARA AUDIT LOGS
-- =====================================================

-- 1. Adicionar coluna para rastrear origem da inserção
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS inserted_by_trigger text,
ADD COLUMN IF NOT EXISTS log_hash text;

-- 2. Criar função para gerar hash de integridade
CREATE OR REPLACE FUNCTION public.generate_audit_log_hash(
  p_user_id uuid,
  p_action text,
  p_table_name text,
  p_record_id uuid,
  p_timestamp timestamptz
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Gera um hash simples baseado nos dados principais
  RETURN encode(
    digest(
      COALESCE(p_user_id::text, '') || 
      COALESCE(p_action, '') || 
      COALESCE(p_table_name, '') || 
      COALESCE(p_record_id::text, '') || 
      COALESCE(p_timestamp::text, ''),
      'sha256'
    ),
    'hex'
  );
END;
$$;

-- 3. Criar função de verificação de integridade dos logs
CREATE OR REPLACE FUNCTION public.verify_audit_log_integrity(p_log_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log record;
  v_computed_hash text;
BEGIN
  -- Buscar o log
  SELECT * INTO v_log
  FROM public.audit_logs
  WHERE id = p_log_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Calcular o hash esperado
  v_computed_hash := public.generate_audit_log_hash(
    v_log.user_id,
    v_log.action,
    v_log.table_name,
    v_log.record_id,
    v_log.created_at
  );

  -- Comparar com o hash armazenado
  RETURN v_log.log_hash = v_computed_hash;
END;
$$;

-- 4. Criar função para admins verificarem a saúde dos audit logs
CREATE OR REPLACE FUNCTION public.check_audit_logs_health()
RETURNS TABLE (
  total_logs bigint,
  logs_without_trigger_info bigint,
  logs_without_hash bigint,
  recent_logs_count bigint,
  integrity_issues bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas admins podem executar
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can check audit log health';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*) as total_logs,
    COUNT(*) FILTER (WHERE inserted_by_trigger IS NULL) as logs_without_trigger_info,
    COUNT(*) FILTER (WHERE log_hash IS NULL) as logs_without_hash,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_logs_count,
    COUNT(*) FILTER (
      WHERE log_hash IS NOT NULL 
      AND NOT public.verify_audit_log_integrity(id)
    ) as integrity_issues
  FROM public.audit_logs;
END;
$$;

-- 5. Atualizar trigger function para products com validações extras
CREATE OR REPLACE FUNCTION public.log_products_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_email text;
  v_user_name text;
  v_log_id uuid;
  v_log_hash text;
BEGIN
  -- Validação: garantir que temos um contexto de usuário válido para operações não-sistema
  IF auth.uid() IS NULL AND TG_OP != 'DELETE' THEN
    RAISE WARNING 'Audit log: No authenticated user context for % operation', TG_OP;
  END IF;

  SELECT email, full_name INTO v_user_email, v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'INSERT', 'products', NEW.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      new_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(), 
      COALESCE(v_user_email, 'unknown'), 
      v_user_name,
      'INSERT',
      'products',
      NEW.id,
      to_jsonb(NEW),
      'log_products_changes',
      v_log_hash
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'UPDATE', 'products', NEW.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      old_data, new_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(), 
      COALESCE(v_user_email, 'unknown'), 
      v_user_name,
      'UPDATE',
      'products',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      'log_products_changes',
      v_log_hash
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'DELETE', 'products', OLD.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      old_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(), 
      COALESCE(v_user_email, 'unknown'), 
      v_user_name,
      'DELETE',
      'products',
      OLD.id,
      to_jsonb(OLD),
      'log_products_changes',
      v_log_hash
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- 6. Atualizar trigger function para withdrawals
CREATE OR REPLACE FUNCTION public.log_withdrawals_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_email text;
  v_user_name text;
  v_log_hash text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE WARNING 'Audit log: No authenticated user context for withdrawals operation';
  END IF;

  SELECT email, full_name INTO v_user_email, v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'INSERT', 'material_withdrawals', NEW.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      new_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(), 
      COALESCE(v_user_email, 'unknown'), 
      v_user_name,
      'INSERT',
      'material_withdrawals',
      NEW.id,
      to_jsonb(NEW),
      'log_withdrawals_changes',
      v_log_hash
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'DELETE', 'material_withdrawals', OLD.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      old_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(), 
      COALESCE(v_user_email, 'unknown'), 
      v_user_name,
      'DELETE',
      'material_withdrawals',
      OLD.id,
      to_jsonb(OLD),
      'log_withdrawals_changes',
      v_log_hash
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 7. Atualizar trigger function para reports
CREATE OR REPLACE FUNCTION public.log_reports_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_email text;
  v_user_name text;
  v_log_hash text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE WARNING 'Audit log: No authenticated user context for reports operation';
  END IF;

  SELECT email, full_name INTO v_user_email, v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'INSERT', 'reports', NEW.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      new_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(), 
      COALESCE(v_user_email, 'unknown'), 
      v_user_name,
      'INSERT',
      'reports',
      NEW.id,
      to_jsonb(NEW),
      'log_reports_changes',
      v_log_hash
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'UPDATE', 'reports', NEW.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      old_data, new_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(), 
      COALESCE(v_user_email, 'unknown'), 
      v_user_name,
      'UPDATE',
      'reports',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      'log_reports_changes',
      v_log_hash
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'DELETE', 'reports', OLD.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      old_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(), 
      COALESCE(v_user_email, 'unknown'), 
      v_user_name,
      'DELETE',
      'reports',
      OLD.id,
      to_jsonb(OLD),
      'log_reports_changes',
      v_log_hash
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 8. Atualizar trigger function para assets
CREATE OR REPLACE FUNCTION public.log_assets_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_email text;
  v_user_name text;
  v_log_hash text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE WARNING 'Audit log: No authenticated user context for assets operation';
  END IF;

  SELECT email, full_name INTO v_user_email, v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'INSERT', 'assets', NEW.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      new_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(), 
      COALESCE(v_user_email, 'unknown'), 
      v_user_name,
      'INSERT',
      'assets',
      NEW.id,
      to_jsonb(NEW),
      'log_assets_changes',
      v_log_hash
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'UPDATE', 'assets', NEW.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      old_data, new_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(), 
      COALESCE(v_user_email, 'unknown'), 
      v_user_name,
      'UPDATE',
      'assets',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      'log_assets_changes',
      v_log_hash
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'DELETE', 'assets', OLD.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      old_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(), 
      COALESCE(v_user_email, 'unknown'), 
      v_user_name,
      'DELETE',
      'assets',
      OLD.id,
      to_jsonb(OLD),
      'log_assets_changes',
      v_log_hash
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 9. Atualizar trigger function para permissions
CREATE OR REPLACE FUNCTION public.log_permissions_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_email text;
  v_user_name text;
  v_user_id uuid;
  v_log_hash text;
BEGIN
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
    v_log_hash := public.generate_audit_log_hash(
      v_user_id, 'UPDATE', 'user_permissions', NEW.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      old_data, new_data, inserted_by_trigger, log_hash
    ) VALUES (
      v_user_id, 
      COALESCE(v_user_email, 'system'), 
      v_user_name,
      'UPDATE',
      'user_permissions',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      'log_permissions_changes',
      v_log_hash
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- 10. Criar índice para melhorar performance das verificações
CREATE INDEX IF NOT EXISTS idx_audit_logs_trigger 
ON public.audit_logs(inserted_by_trigger);

CREATE INDEX IF NOT EXISTS idx_audit_logs_hash 
ON public.audit_logs(log_hash);

-- 11. Adicionar comentários para documentação
COMMENT ON COLUMN public.audit_logs.inserted_by_trigger IS 
'Nome do trigger que inseriu este log, usado para rastreamento e validação de integridade';

COMMENT ON COLUMN public.audit_logs.log_hash IS 
'Hash SHA-256 dos dados principais do log para detecção de manipulação';

COMMENT ON FUNCTION public.generate_audit_log_hash IS 
'Gera um hash SHA-256 dos campos principais de um audit log para verificação de integridade';

COMMENT ON FUNCTION public.verify_audit_log_integrity IS 
'Verifica se um audit log específico não foi manipulado comparando seu hash armazenado com o hash calculado';

COMMENT ON FUNCTION public.check_audit_logs_health IS 
'Função administrativa para verificar a saúde geral do sistema de audit logs, incluindo logs sem hash e problemas de integridade';