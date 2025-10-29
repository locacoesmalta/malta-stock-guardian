-- Primeiro, deletar todas as políticas problemáticas
DO $$ 
DECLARE 
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'conversations' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON conversations', pol.policyname);
  END LOOP;
END $$;

-- Criar função security definer para verificar participação em conversa
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_id = _conversation_id
      AND user_id = _user_id
  )
$$;

-- Criar políticas corretas para conversations
CREATE POLICY "conversations_select_policy"
ON conversations
FOR SELECT
USING (
  type = 'global'
  OR
  public.is_conversation_participant(auth.uid(), id)
  OR
  is_admin(auth.uid())
);

CREATE POLICY "conversations_insert_policy"
ON conversations
FOR INSERT
WITH CHECK (is_user_active(auth.uid()));

CREATE POLICY "conversations_update_policy"
ON conversations
FOR UPDATE
USING (public.is_conversation_participant(auth.uid(), id) OR is_admin(auth.uid()));

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);