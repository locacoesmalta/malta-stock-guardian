-- FASE 1: CORRIGIR POLICY DE patrimonio_historico (URGENTE - DESBLOQUEIA O SISTEMA)
-- Remove policy restritiva que bloqueia todos os inserts
DROP POLICY IF EXISTS "Apenas sistema pode inserir histórico" ON public.patrimonio_historico;

-- Cria nova policy permitindo inserts autenticados via RPC
CREATE POLICY "Authenticated users can insert via RPC"
ON public.patrimonio_historico
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- FASE 2: LIMPAR POLICIES DUPLICADAS EM user_permissions
-- Remove policies antigas de admin que conflitam com system owner
DROP POLICY IF EXISTS "Admins can insert permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can update permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins can delete permissions" ON public.user_permissions;

-- FASE 3: ADICIONAR POLICY DE DELETE PARA SYSTEM OWNER
-- Completa o conjunto de policies CRUD restritas ao system owner
CREATE POLICY "Only system owner can delete user permissions"
ON public.user_permissions
FOR DELETE
TO authenticated
USING (public.is_system_owner(auth.uid()));

-- Documentação das correções
COMMENT ON POLICY "Authenticated users can insert via RPC" ON public.patrimonio_historico IS 
'Permite que usuários autenticados insiram eventos no histórico através da função registrar_evento_patrimonio (SECURITY DEFINER). Isso desbloqueia cadastro e movimentação de equipamentos.';

COMMENT ON POLICY "Only system owner can delete user permissions" ON public.user_permissions IS 
'Restringe exclusão de permissões de usuário exclusivamente ao system owner (walterknothead@gmail.com), completando proteção CRUD junto com policies de INSERT e UPDATE existentes.';