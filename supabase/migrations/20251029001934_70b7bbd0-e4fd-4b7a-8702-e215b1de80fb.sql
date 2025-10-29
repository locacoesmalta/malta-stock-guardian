-- Primeiro, desabilitar RLS temporariamente para deletar políticas
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Deletar TODAS as políticas existentes
DO $$ 
DECLARE 
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'conversation_participants' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON conversation_participants', pol.policyname);
  END LOOP;
  
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'messages' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON messages', pol.policyname);
  END LOOP;
END $$;

-- Reabilitar RLS
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Criar políticas simples e diretas para conversation_participants
CREATE POLICY "cp_select_policy"
ON conversation_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = conversation_participants.conversation_id 
    AND c.type = 'global'
  )
  OR
  user_id = auth.uid()
  OR
  is_admin(auth.uid())
);

CREATE POLICY "cp_insert_policy"
ON conversation_participants
FOR INSERT
WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "cp_update_policy"
ON conversation_participants
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "cp_delete_policy"
ON conversation_participants
FOR DELETE
USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- Criar políticas simples para messages
CREATE POLICY "msg_select_policy"
ON messages
FOR SELECT
USING (
  is_global = true
  OR
  user_id = auth.uid()
  OR
  is_admin(auth.uid())
);

CREATE POLICY "msg_insert_policy"
ON messages
FOR INSERT
WITH CHECK (
  is_user_active(auth.uid())
  AND user_id = auth.uid()
);

CREATE POLICY "msg_update_policy"
ON messages
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "msg_delete_policy"
ON messages
FOR DELETE
USING (user_id = auth.uid() OR is_admin(auth.uid()));