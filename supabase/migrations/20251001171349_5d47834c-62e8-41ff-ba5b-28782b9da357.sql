-- Adicionar políticas RLS de segurança para a tabela user_roles
-- Apenas administradores devem poder criar, atualizar ou deletar roles

-- Política de INSERT: apenas admins podem atribuir roles
CREATE POLICY "Only admins can assign roles"
ON public.user_roles
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Política de UPDATE: apenas admins podem atualizar roles
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Política de DELETE: apenas admins podem remover roles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (is_admin(auth.uid()));