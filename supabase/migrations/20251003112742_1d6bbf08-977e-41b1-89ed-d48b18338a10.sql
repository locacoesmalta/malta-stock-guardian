-- ============================================
-- FASE 1: Restringir Acesso ao Histórico de Patrimônio
-- ============================================

-- Remover policy permissiva atual
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar histórico" ON patrimonio_historico;

-- Criar policy restrita (apenas admins podem visualizar)
CREATE POLICY "Apenas admins podem visualizar histórico"
ON patrimonio_historico FOR SELECT
USING (is_admin(auth.uid()));

-- ============================================
-- FASE 2: Corrigir Function Search Path
-- ============================================

-- Adicionar SET search_path em todas as funções que não têm
ALTER FUNCTION public.handle_new_user_auto_activate() SET search_path TO 'public';
ALTER FUNCTION public.decrease_stock_on_withdrawal() SET search_path TO 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path TO 'public';
ALTER FUNCTION public.log_asset_changes() SET search_path TO 'public';
ALTER FUNCTION public.log_products_changes() SET search_path TO 'public';
ALTER FUNCTION public.log_withdrawals_changes() SET search_path TO 'public';
ALTER FUNCTION public.log_reports_changes() SET search_path TO 'public';
ALTER FUNCTION public.log_permissions_changes() SET search_path TO 'public';
ALTER FUNCTION public.handle_new_user() SET search_path TO 'public';
ALTER FUNCTION public.registrar_evento_patrimonio(uuid, text, text, text, text, text, text) SET search_path TO 'public';