-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_user_id ON public.messages(user_id);

-- Habilitar RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuários ativos podem ver todas as mensagens
CREATE POLICY "Active users can view all messages"
  ON public.messages
  FOR SELECT
  USING (is_user_active(auth.uid()));

-- Usuários ativos podem inserir suas próprias mensagens
CREATE POLICY "Active users can insert their own messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (is_user_active(auth.uid()) AND auth.uid() = user_id);

-- Usuários podem atualizar apenas suas próprias mensagens
CREATE POLICY "Users can update their own messages"
  ON public.messages
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuários podem deletar apenas suas próprias mensagens
CREATE POLICY "Users can delete their own messages"
  ON public.messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentário
COMMENT ON TABLE public.messages IS 'Mensagens do sistema de chat em tempo real';