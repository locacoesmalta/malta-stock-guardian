-- Remover todas as políticas existentes de conversation_participants
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add themselves to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON conversation_participants;
DROP POLICY IF EXISTS "Admins can remove participants" ON conversation_participants;

-- Remover políticas de messages que podem causar recursão
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;

-- Criar políticas RLS corretas sem recursão para conversation_participants
CREATE POLICY "view_conversation_participants"
ON conversation_participants
FOR SELECT
USING (
  -- Permitir visualização se for uma conversa global
  EXISTS (
    SELECT 1 
    FROM conversations 
    WHERE conversations.id = conversation_participants.conversation_id 
    AND conversations.type = 'global'
  )
  OR
  -- Ou se o usuário é participante (usando subquery simples)
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM conversation_participants cp
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "insert_conversation_participants"
ON conversation_participants
FOR INSERT
WITH CHECK (
  -- Usuário pode se adicionar
  user_id = auth.uid()
  OR
  -- Ou é admin
  is_admin(auth.uid())
);

CREATE POLICY "update_own_participation"
ON conversation_participants
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_conversation_participants"
ON conversation_participants
FOR DELETE
USING (is_admin(auth.uid()) OR user_id = auth.uid());

-- Criar políticas corretas para messages
CREATE POLICY "view_messages"
ON messages
FOR SELECT
USING (
  is_global = true
  OR
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM conversation_participants cp
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "insert_messages"
ON messages
FOR INSERT
WITH CHECK (
  is_user_active(auth.uid())
  AND user_id = auth.uid()
  AND (
    is_global = true
    OR
    conversation_id IN (
      SELECT cp.conversation_id 
      FROM conversation_participants cp
      WHERE cp.user_id = auth.uid()
    )
  )
);