-- Remover política pública do catálogo de equipamentos
DROP POLICY IF EXISTS "Todos podem visualizar catálogo de equipamentos" ON public.equipment_rental_catalog;
DROP POLICY IF EXISTS "Todos podem visualizar catálogo" ON public.equipment_rental_catalog;

-- Criar política restrita a usuários autenticados e ativos
CREATE POLICY "Apenas usuários autenticados podem ver catálogo"
ON public.equipment_rental_catalog
FOR SELECT
TO authenticated
USING (is_user_active(auth.uid()));