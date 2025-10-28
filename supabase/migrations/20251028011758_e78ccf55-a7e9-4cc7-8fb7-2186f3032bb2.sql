-- Criar tabela de conversas (privadas e grupos)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group', 'global')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar tabela de participantes de conversas
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  UNIQUE(conversation_id, user_id)
);

-- Modificar tabela messages para suportar conversas
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT TRUE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);

-- Criar tabela de grupos
CREATE TABLE IF NOT EXISTS public.chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  avatar_url TEXT
);

-- Criar tabela de permissões de grupo
CREATE TABLE IF NOT EXISTS public.group_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  can_add_members BOOLEAN DEFAULT FALSE,
  can_remove_members BOOLEAN DEFAULT FALSE,
  UNIQUE(group_id, user_id)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para conversas
CREATE POLICY "Users can view own conversations"
ON public.conversations FOR SELECT
USING (
  type = 'global' OR
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conversations.id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (is_user_active(auth.uid()));

-- Políticas RLS para participantes
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add themselves to conversations"
ON public.conversation_participants FOR INSERT
WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can update their own participation"
ON public.conversation_participants FOR UPDATE
USING (user_id = auth.uid());

-- Atualizar política de mensagens
DROP POLICY IF EXISTS "Active users can view all messages" ON public.messages;
CREATE POLICY "Users can view messages from their conversations"
ON public.messages FOR SELECT
USING (
  is_global = TRUE OR
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Active users can insert their own messages" ON public.messages;
CREATE POLICY "Users can send messages to their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  is_user_active(auth.uid()) AND 
  user_id = auth.uid() AND
  (
    is_global = TRUE OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  )
);

-- Políticas RLS para grupos
CREATE POLICY "Members can view group details"
ON public.chat_groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = chat_groups.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create groups"
ON public.chat_groups FOR INSERT
WITH CHECK (is_user_active(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Group admins can update groups"
ON public.chat_groups FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.group_permissions
    WHERE group_id = chat_groups.id
    AND user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Políticas RLS para permissões de grupo
CREATE POLICY "Members can view group permissions"
ON public.group_permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    JOIN public.chat_groups cg ON cg.conversation_id = cp.conversation_id
    WHERE cg.id = group_permissions.group_id
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Group admins can manage permissions"
ON public.group_permissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.group_permissions gp
    WHERE gp.group_id = group_permissions.group_id
    AND gp.user_id = auth.uid()
    AND gp.role = 'admin'
  )
);

-- Habilitar Realtime para todas as novas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_permissions;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_updated_at();