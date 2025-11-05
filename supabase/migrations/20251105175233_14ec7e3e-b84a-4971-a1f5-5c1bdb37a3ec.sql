-- ============================================
-- CORREÇÃO DE SEGURANÇA CRÍTICA
-- Exigir autenticação para ler mensagens globais
-- ============================================

-- Remover policy insegura
DROP POLICY IF EXISTS "msg_select_policy" ON public.messages;

-- Criar policy segura que exige autenticação
CREATE POLICY "msg_select_policy" 
ON public.messages 
FOR SELECT 
TO authenticated  -- Apenas usuários autenticados
USING (
  -- Usuários autenticados podem ver:
  -- 1. Mensagens globais
  -- 2. Suas próprias mensagens
  -- 3. Admins veem tudo
  (is_global = true) OR 
  (user_id = auth.uid()) OR 
  is_admin(auth.uid())
);

-- Adicionar comentário explicativo
COMMENT ON POLICY "msg_select_policy" ON public.messages IS 
'Permite que usuários autenticados vejam mensagens globais, suas próprias mensagens, ou tudo se for admin. EXIGE AUTENTICAÇÃO para prevenir acesso público.';