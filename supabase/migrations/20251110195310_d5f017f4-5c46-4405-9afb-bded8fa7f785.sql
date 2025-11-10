-- Tabela para rastrear presença e atividade de usuários em tempo real
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL,
  current_route TEXT,
  browser_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Índices para melhor performance
CREATE INDEX idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX idx_user_presence_is_online ON public.user_presence(is_online);
CREATE INDEX idx_user_presence_last_activity ON public.user_presence(last_activity);

-- Habilitar RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem visualizar presença de todos os usuários
CREATE POLICY "Admins can view all user presence"
ON public.user_presence
FOR SELECT
TO authenticated
USING (is_admin_or_superuser(auth.uid()));

-- Política: Usuários podem inserir/atualizar sua própria presença
CREATE POLICY "Users can insert their own presence"
ON public.user_presence
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence"
ON public.user_presence
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar sua própria presença
CREATE POLICY "Users can delete their own presence"
ON public.user_presence
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_user_presence_updated_at
BEFORE UPDATE ON public.user_presence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Função para limpar sessões inativas (mais de 30 minutos sem atualização)
CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Marcar como offline sessões inativas há mais de 30 minutos
  UPDATE public.user_presence
  SET is_online = false
  WHERE is_online = true 
    AND last_activity < now() - interval '30 minutes';
END;
$$;

COMMENT ON TABLE public.user_presence IS 'Rastreia a presença e atividade dos usuários em tempo real';
COMMENT ON FUNCTION public.cleanup_inactive_sessions IS 'Limpa sessões inativas automaticamente';