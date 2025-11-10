-- Corrigir função cleanup_inactive_sessions para ter search_path definido
CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Marcar como offline sessões inativas há mais de 30 minutos
  UPDATE public.user_presence
  SET is_online = false
  WHERE is_online = true 
    AND last_activity < now() - interval '30 minutes';
END;
$$;