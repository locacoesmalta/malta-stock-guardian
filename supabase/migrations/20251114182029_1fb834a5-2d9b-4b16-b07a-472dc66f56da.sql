-- FASE 1: Limpeza automática de sessões stale
-- Criar jobs de limpeza automática com pg_cron

-- Habilitar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Job 1: Deletar sessões offline antigas (>7 dias) a cada 15 minutos
SELECT cron.schedule(
  'cleanup-old-presence-sessions',
  '*/15 * * * *',
  $$
  DELETE FROM user_presence 
  WHERE is_online = false 
    AND updated_at < NOW() - INTERVAL '7 days'
  $$
);

-- Job 2: Marcar sessões stale como offline (>30 min inativas) a cada 5 minutos
SELECT cron.schedule(
  'mark-stale-sessions-offline',
  '*/5 * * * *',
  $$
  UPDATE user_presence 
  SET is_online = false,
      updated_at = NOW()
  WHERE is_online = true 
    AND last_activity < NOW() - INTERVAL '30 minutes'
  $$
);

-- FASE 5: Adicionar índices críticos para performance

-- Índices para user_presence (queries muito frequentes)
CREATE INDEX IF NOT EXISTS idx_user_presence_user_session 
  ON user_presence(user_id, session_id);

CREATE INDEX IF NOT EXISTS idx_user_presence_last_activity 
  ON user_presence(last_activity) WHERE is_online = true;

CREATE INDEX IF NOT EXISTS idx_user_presence_online_status
  ON user_presence(is_online, updated_at);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
  ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action 
  ON audit_logs(user_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name
  ON audit_logs(table_name, created_at DESC);

-- Índices para error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at 
  ON error_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_type_created 
  ON error_logs(error_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_user_id
  ON error_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- FASE 6: Fun��ão RPC para estatísticas de saúde de sessões
CREATE OR REPLACE FUNCTION get_session_health_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'active_sessions', (
      SELECT COUNT(*) 
      FROM user_presence 
      WHERE is_online = true
    ),
    'stale_sessions', (
      SELECT COUNT(*) 
      FROM user_presence 
      WHERE is_online = true 
        AND last_activity < NOW() - INTERVAL '30 minutes'
    ),
    'unique_users', (
      SELECT COUNT(DISTINCT user_id) 
      FROM user_presence 
      WHERE is_online = true
    ),
    'multi_session_users', (
      SELECT COUNT(*) 
      FROM (
        SELECT user_id 
        FROM user_presence 
        WHERE is_online = true 
        GROUP BY user_id 
        HAVING COUNT(*) > 1
      ) AS multi_users
    ),
    'total_sessions_24h', (
      SELECT COUNT(*) 
      FROM user_presence 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    ),
    'avg_session_duration', (
      SELECT COALESCE(
        EXTRACT(EPOCH FROM AVG(updated_at - created_at)) / 60,
        0
      )::integer
      FROM user_presence 
      WHERE is_online = false 
        AND updated_at > NOW() - INTERVAL '24 hours'
    )
  ) INTO result;
  
  RETURN result;
END;
$$;