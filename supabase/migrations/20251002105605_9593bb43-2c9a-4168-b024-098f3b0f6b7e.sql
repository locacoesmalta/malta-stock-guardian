-- Remover políticas antigas de INSERT e UPDATE
DROP POLICY IF EXISTS "Only admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Only admins can update products" ON public.products;

-- Criar novas políticas que permitem INSERT e UPDATE para usuários com permissões
CREATE POLICY "Users with permission can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (can_user_edit_products(auth.uid()));

CREATE POLICY "Users with permission can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (can_user_edit_products(auth.uid()))
WITH CHECK (can_user_edit_products(auth.uid()));