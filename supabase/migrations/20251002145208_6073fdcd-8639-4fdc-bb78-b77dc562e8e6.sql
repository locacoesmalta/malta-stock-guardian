-- Corrigir política RLS da tabela audit_logs
-- Remove a política insegura que permite usuários inserirem seus próprios logs

-- Remover política antiga permissiva
DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.audit_logs;

-- Criar nova política que bloqueia inserções diretas de usuários
-- Apenas triggers e funções SECURITY DEFINER podem inserir
CREATE POLICY "Apenas sistema pode inserir audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (false);

-- A política acima bloqueia inserções diretas de usuários
-- Mas triggers (como log_products_changes, log_withdrawals_changes, etc.)
-- e funções SECURITY DEFINER continuarão funcionando normalmente
-- pois executam com os privilégios do proprietário do banco

COMMENT ON POLICY "Apenas sistema pode inserir audit logs" ON public.audit_logs 
IS 'Bloqueia inserções diretas de usuários. Apenas triggers e funções SECURITY DEFINER podem inserir logs de auditoria, garantindo integridade do histórico.';