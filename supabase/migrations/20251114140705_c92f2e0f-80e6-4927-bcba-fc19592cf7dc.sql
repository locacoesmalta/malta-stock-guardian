-- =========================================
-- FASE 1: Corrigir RLS e Constraints de user_presence
-- =========================================

-- 1. Adicionar constraint UNIQUE para evitar duplicatas
-- Previne múltiplos registros do mesmo usuário na mesma sessão
ALTER TABLE public.user_presence 
DROP CONSTRAINT IF EXISTS unique_user_session;

ALTER TABLE public.user_presence 
ADD CONSTRAINT unique_user_session 
UNIQUE (user_id, session_id);

COMMENT ON CONSTRAINT unique_user_session ON public.user_presence IS 
'Garante que cada usuário pode ter apenas um registro de presença por sessão.
Previne duplicatas e permite upsert seguro com on_conflict.';

-- 2. Atualizar RLS policies para validar auth.uid() não-nulo
-- DROP policies antigas
DROP POLICY IF EXISTS "Users can insert their own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users can delete their own presence" ON public.user_presence;

-- Criar policies melhoradas com validação explícita
CREATE POLICY "Users can insert their own presence"
ON public.user_presence
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Users can update their own presence"
ON public.user_presence
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Users can delete their own presence"
ON public.user_presence
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- 3. Adicionar índice para performance em buscas por usuário/sessão
CREATE INDEX IF NOT EXISTS idx_user_presence_user_session 
ON public.user_presence(user_id, session_id)
WHERE is_online = true;

COMMENT ON INDEX idx_user_presence_user_session IS 
'Acelera buscas de presença ativa por usuário e sessão.
Usa partial index apenas para sessões online.';

-- 4. Criar índice para limpeza de sessões antigas
CREATE INDEX IF NOT EXISTS idx_user_presence_cleanup 
ON public.user_presence(is_online, updated_at)
WHERE is_online = false;

COMMENT ON INDEX idx_user_presence_cleanup IS 
'Acelera queries de limpeza de sessões offline antigas.';

-- 5. Criar função de limpeza automática de sessões antigas
CREATE OR REPLACE FUNCTION public.cleanup_old_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Limpar sessões offline com mais de 7 dias
  DELETE FROM public.user_presence
  WHERE is_online = false
    AND updated_at < NOW() - INTERVAL '7 days';
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_presence IS 
'Remove registros de presença offline com mais de 7 dias.
Executar periodicamente para manter tabela limpa.
SECURITY DEFINER necessário para permitir limpeza sem privilégios especiais.';

-- 6. Documentar uso de SECURITY DEFINER na view de auditoria
COMMENT ON VIEW public.audit_logs_integrity_status IS 
'View com SECURITY DEFINER para verificação de integridade de logs de auditoria.
Acesso restrito apenas a admins via is_admin_or_superuser().
SECURITY DEFINER é NECESSÁRIO para executar verify_audit_log_signature() 
que precisa acessar dados de assinatura protegidos por RLS.
Esta configuração é segura pois:
1. WHERE clause valida permissões explicitamente
2. Apenas admins/superusers podem acessar
3. Não expõe dados sensíveis além do necessário para auditoria';

-- 7. Limpar sessões duplicadas existentes (manter apenas a mais recente por usuário/sessão)
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, session_id 
      ORDER BY updated_at DESC, created_at DESC
    ) as rn
  FROM public.user_presence
)
DELETE FROM public.user_presence
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);