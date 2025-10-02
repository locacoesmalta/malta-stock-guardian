-- Corrigir política RLS da tabela patrimonio_historico
-- Remove a política insegura que permite qualquer usuário inserir

-- Remover política antiga permissiva
DROP POLICY IF EXISTS "Sistema pode inserir no histórico" ON public.patrimonio_historico;

-- Criar nova política que permite inserções apenas de triggers/funções do sistema
-- Triggers e funções SECURITY DEFINER executam com privilégios do dono, não do usuário
CREATE POLICY "Apenas sistema pode inserir histórico"
  ON public.patrimonio_historico
  FOR INSERT
  WITH CHECK (false);

-- A política acima bloqueia inserções diretas de usuários
-- Mas triggers e funções SECURITY DEFINER continuarão funcionando
-- pois executam com os privilégios do proprietário da função/trigger

COMMENT ON POLICY "Apenas sistema pode inserir histórico" ON public.patrimonio_historico 
IS 'Bloqueia inserções diretas. Apenas triggers e funções SECURITY DEFINER podem inserir registros de histórico.';