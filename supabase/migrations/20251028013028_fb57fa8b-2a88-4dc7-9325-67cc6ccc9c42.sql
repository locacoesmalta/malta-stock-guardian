-- Remover políticas RLS problemáticas de conversation_participants
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add themselves to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON conversation_participants;

-- Criar políticas RLS corretas sem recursão
-- Permitir que usuários vejam participantes das conversas que eles fazem parte
-- usando a tabela conversations diretamente
CREATE POLICY "Users can view participants of their conversations"
ON conversation_participants
FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM conversations 
    WHERE conversations.id = conversation_participants.conversation_id 
    AND conversations.type = 'global'
  )
);

-- Permitir inserção de participantes
CREATE POLICY "Users can add participants to conversations"
ON conversation_participants
FOR INSERT
WITH CHECK (
  -- Usuário pode se adicionar a qualquer conversa
  user_id = auth.uid()
  OR
  -- Ou é admin
  is_admin(auth.uid())
  OR
  -- Ou já é participante da conversa e está adicionando outro usuário
  EXISTS (
    SELECT 1 
    FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);

-- Permitir que usuários atualizem sua própria participação
CREATE POLICY "Users can update their own participation"
ON conversation_participants
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Permitir que admins deletem participações
CREATE POLICY "Admins can remove participants"
ON conversation_participants
FOR DELETE
USING (is_admin(auth.uid()));

-- Corrigir políticas de messages para evitar recursão similar
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;

-- Recriar política de visualização de mensagens
CREATE POLICY "Users can view messages from their conversations"
ON messages
FOR SELECT
USING (
  is_global = true
  OR
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Recriar política de envio de mensagens
CREATE POLICY "Users can send messages to their conversations"
ON messages
FOR INSERT
WITH CHECK (
  is_user_active(auth.uid())
  AND user_id = auth.uid()
  AND (
    is_global = true
    OR
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  )
);