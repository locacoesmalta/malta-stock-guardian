-- Função para verificar integridade de produtos
CREATE OR REPLACE FUNCTION public.check_products_integrity()
RETURNS TABLE(
  product_id UUID,
  product_code TEXT,
  product_name TEXT,
  current_quantity INTEGER,
  has_adjustment_history BOOLEAN,
  issue_type TEXT
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.code,
    p.name,
    p.quantity,
    EXISTS(SELECT 1 FROM product_stock_adjustments WHERE product_id = p.id) as has_adjustment_history,
    CASE 
      WHEN p.quantity > 0 AND NOT EXISTS(SELECT 1 FROM product_stock_adjustments WHERE product_id = p.id) 
        THEN 'Estoque sem histórico'
      WHEN p.quantity < 0 
        THEN 'Estoque negativo'
      ELSE 'OK'
    END as issue_type
  FROM products p
  WHERE p.deleted_at IS NULL
    AND (
      (p.quantity > 0 AND NOT EXISTS(SELECT 1 FROM product_stock_adjustments WHERE product_id = p.id))
      OR p.quantity < 0
    );
$$;

-- Função para verificar integridade de sessões ativas
CREATE OR REPLACE FUNCTION public.check_sessions_integrity()
RETURNS TABLE(
  session_id UUID,
  user_email TEXT,
  user_name TEXT,
  last_activity TIMESTAMP WITH TIME ZONE,
  is_online BOOLEAN,
  session_count BIGINT,
  issue_type TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH session_counts AS (
    SELECT user_id, COUNT(*) as count
    FROM user_presence
    WHERE is_online = true
    GROUP BY user_id
    HAVING COUNT(*) > 1
  )
  SELECT 
    up.id,
    up.user_email,
    up.user_name,
    up.last_activity,
    up.is_online,
    COALESCE(sc.count, 1) as session_count,
    CASE
      WHEN up.is_online = true AND up.last_activity < NOW() - INTERVAL '24 hours'
        THEN 'Sessão inativa há mais de 24h'
      WHEN sc.count > 1
        THEN 'Múltiplas sessões ativas'
      WHEN up.browser_info IS NULL
        THEN 'Informações de navegador ausentes'
      ELSE 'OK'
    END as issue_type
  FROM user_presence up
  LEFT JOIN session_counts sc ON sc.user_id = up.user_id
  WHERE 
    (up.is_online = true AND up.last_activity < NOW() - INTERVAL '24 hours')
    OR sc.count > 1
    OR up.browser_info IS NULL;
$$;

-- Função para verificar integridade de audit logs
CREATE OR REPLACE FUNCTION public.check_audit_logs_integrity()
RETURNS TABLE(
  log_id UUID,
  user_email TEXT,
  action TEXT,
  table_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  issue_type TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    al.id,
    al.user_email,
    al.action,
    al.table_name,
    al.created_at,
    CASE
      WHEN al.log_hash IS NULL
        THEN 'Log sem hash de integridade'
      WHEN al.user_id IS NOT NULL AND NOT EXISTS(
        SELECT 1 FROM auth.users WHERE id = al.user_id
      )
        THEN 'Log órfão (usuário não existe)'
      ELSE 'OK'
    END as issue_type
  FROM audit_logs al
  WHERE 
    al.log_hash IS NULL
    OR (al.user_id IS NOT NULL AND NOT EXISTS(
      SELECT 1 FROM auth.users WHERE id = al.user_id
    ));
$$;

-- Permitir que admins executem essas funções
GRANT EXECUTE ON FUNCTION public.check_products_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_sessions_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_audit_logs_integrity() TO authenticated;