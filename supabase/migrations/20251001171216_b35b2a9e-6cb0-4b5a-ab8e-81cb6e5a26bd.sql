-- Corrigir políticas RLS da tabela assets para usar funções de permissão

-- Remover políticas antigas
DROP POLICY IF EXISTS "Only admins can insert assets" ON public.assets;
DROP POLICY IF EXISTS "Only admins can update assets" ON public.assets;
DROP POLICY IF EXISTS "Only admins can delete assets" ON public.assets;
DROP POLICY IF EXISTS "Authenticated users can view assets" ON public.assets;

-- Criar novas políticas usando funções de permissão
CREATE POLICY "Users with permission can view assets"
ON public.assets
FOR SELECT
USING (can_user_access_assets(auth.uid()));

CREATE POLICY "Users with permission can insert assets"
ON public.assets
FOR INSERT
WITH CHECK (can_user_create_assets(auth.uid()));

CREATE POLICY "Users with permission can update assets"
ON public.assets
FOR UPDATE
USING (can_user_edit_assets(auth.uid()));

CREATE POLICY "Users with permission can delete assets"
ON public.assets
FOR DELETE
USING (can_user_delete_assets(auth.uid()));

-- Corrigir políticas RLS da tabela material_withdrawals

-- Remover política antiga de INSERT
DROP POLICY IF EXISTS "Authenticated users can create withdrawals" ON public.material_withdrawals;

-- Criar nova política usando função de permissão
CREATE POLICY "Users with permission can create withdrawals"
ON public.material_withdrawals
FOR INSERT
WITH CHECK (can_user_create_withdrawals(auth.uid()) AND auth.uid() = withdrawn_by);