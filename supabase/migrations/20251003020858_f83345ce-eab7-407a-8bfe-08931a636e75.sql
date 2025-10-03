-- Corrigir políticas RLS para respeitar permissões de usuários

-- 1. PRODUCTS: Atualizar política de DELETE para usar a função de permissão
DROP POLICY IF EXISTS "Only admins can delete products" ON products;

CREATE POLICY "Users with permission can delete products"
ON products
FOR DELETE
USING (can_user_delete_products(auth.uid()));

-- 2. REPORTS: Atualizar política de UPDATE para usar a função de permissão
DROP POLICY IF EXISTS "Only admins can update reports" ON reports;

CREATE POLICY "Users with permission can update reports"
ON reports
FOR UPDATE
USING (can_user_edit_reports(auth.uid()))
WITH CHECK (can_user_edit_reports(auth.uid()));

-- 3. REPORTS: Atualizar política de DELETE para usar a função de permissão
DROP POLICY IF EXISTS "Only admins can delete reports" ON reports;

CREATE POLICY "Users with permission can delete reports"
ON reports
FOR DELETE
USING (can_user_delete_reports(auth.uid()));