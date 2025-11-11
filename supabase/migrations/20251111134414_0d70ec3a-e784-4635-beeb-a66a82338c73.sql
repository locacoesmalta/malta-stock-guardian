-- Remover policy restritiva de admin-only
DROP POLICY IF EXISTS "Apenas admins podem visualizar histórico" ON public.patrimonio_historico;

-- Criar policy que permite visualização para todos usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar histórico"
ON public.patrimonio_historico
FOR SELECT
TO authenticated
USING (true);