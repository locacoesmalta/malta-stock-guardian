-- ============================================
-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA
-- ============================================

-- 1.1 PROTEGER DADOS FINANCEIROS
-- ============================================

-- Adicionar permissão dedicada para dados financeiros
ALTER TABLE public.user_permissions 
ADD COLUMN IF NOT EXISTS can_view_financial_data BOOLEAN DEFAULT FALSE;

-- Criar função auxiliar para verificar permissão financeira
CREATE OR REPLACE FUNCTION public.can_user_view_financial_data(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT TRUE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'),
    (SELECT is_active AND can_view_financial_data 
     FROM public.user_permissions 
     WHERE user_id = _user_id),
    FALSE
  );
END;
$$;

-- Atualizar políticas RLS de cash_boxes
DROP POLICY IF EXISTS "Users with permission can view cash boxes" ON public.cash_boxes;
CREATE POLICY "Only users with financial permission can view cash boxes"
ON public.cash_boxes FOR SELECT
TO authenticated
USING (can_user_view_financial_data(auth.uid()));

DROP POLICY IF EXISTS "Users with permission can create cash boxes" ON public.cash_boxes;
CREATE POLICY "Only users with financial permission can create cash boxes"
ON public.cash_boxes FOR INSERT
TO authenticated
WITH CHECK (can_user_view_financial_data(auth.uid()));

DROP POLICY IF EXISTS "Users with permission can update cash boxes" ON public.cash_boxes;
CREATE POLICY "Only users with financial permission can update cash boxes"
ON public.cash_boxes FOR UPDATE
TO authenticated
USING (can_user_view_financial_data(auth.uid()));

DROP POLICY IF EXISTS "Users with permission can delete cash boxes" ON public.cash_boxes;
CREATE POLICY "Only users with financial permission can delete cash boxes"
ON public.cash_boxes FOR DELETE
TO authenticated
USING (can_user_view_financial_data(auth.uid()));

-- Atualizar políticas RLS de cash_box_transactions
DROP POLICY IF EXISTS "Users with permission can view transactions" ON public.cash_box_transactions;
CREATE POLICY "Only users with financial permission can view transactions"
ON public.cash_box_transactions FOR SELECT
TO authenticated
USING (can_user_view_financial_data(auth.uid()));

DROP POLICY IF EXISTS "Users with permission can create transactions" ON public.cash_box_transactions;
CREATE POLICY "Only users with financial permission can create transactions"
ON public.cash_box_transactions FOR INSERT
TO authenticated
WITH CHECK (can_user_view_financial_data(auth.uid()) AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Users with permission can update transactions" ON public.cash_box_transactions;
CREATE POLICY "Only users with financial permission can update transactions"
ON public.cash_box_transactions FOR UPDATE
TO authenticated
USING (can_user_view_financial_data(auth.uid()));

DROP POLICY IF EXISTS "Users with permission can delete transactions" ON public.cash_box_transactions;
CREATE POLICY "Only users with financial permission can delete transactions"
ON public.cash_box_transactions FOR DELETE
TO authenticated
USING (can_user_view_financial_data(auth.uid()));

-- 1.2 CRIPTOGRAFAR DADOS SENSÍVEIS DE RECIBOS
-- ============================================

-- Habilitar extensão de criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Adicionar coluna para CPF criptografado
ALTER TABLE public.equipment_receipts 
ADD COLUMN IF NOT EXISTS received_by_cpf_encrypted TEXT;

-- Criar tabela de auditoria de acessos a recibos
CREATE TABLE IF NOT EXISTS public.receipt_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  receipt_id UUID REFERENCES public.equipment_receipts(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS na tabela de logs de acesso
ALTER TABLE public.receipt_access_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs de acesso
CREATE POLICY "Only admins can view receipt access logs"
ON public.receipt_access_logs FOR SELECT
TO authenticated
USING (is_admin_or_superuser(auth.uid()));

-- Sistema pode inserir logs
CREATE POLICY "System can insert receipt access logs"
ON public.receipt_access_logs FOR INSERT
TO authenticated
WITH CHECK (TRUE);

-- Criar função para criptografar CPF
CREATE OR REPLACE FUNCTION public.encrypt_receipt_cpf()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_encryption_key TEXT;
BEGIN
  -- Usar chave fixa para criptografia (em produção, usar secrets management)
  v_encryption_key := 'malta-cpf-encryption-key-2025-secure';
  
  IF NEW.received_by_cpf IS NOT NULL AND NEW.received_by_cpf != '' THEN
    -- Criptografar CPF usando AES
    NEW.received_by_cpf_encrypted := encode(
      encrypt(
        NEW.received_by_cpf::bytea,
        v_encryption_key::bytea,
        'aes'
      ),
      'base64'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para criptografar CPF automaticamente
DROP TRIGGER IF EXISTS encrypt_receipt_cpf_trigger ON public.equipment_receipts;
CREATE TRIGGER encrypt_receipt_cpf_trigger
BEFORE INSERT OR UPDATE ON public.equipment_receipts
FOR EACH ROW
EXECUTE FUNCTION public.encrypt_receipt_cpf();

-- 1.3 FORTALECER INTEGRIDADE DE AUDIT LOGS
-- ============================================

-- Adicionar coluna de assinatura criptográfica
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS signature TEXT;

-- Criar função para gerar assinatura HMAC do log
CREATE OR REPLACE FUNCTION public.sign_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_data_to_sign TEXT;
  v_signing_key TEXT;
BEGIN
  -- Usar chave de assinatura fixa (em produção, usar secrets management)
  v_signing_key := 'malta-audit-signing-key-2025';
  
  -- Concatenar dados críticos do log
  v_data_to_sign := CONCAT(
    COALESCE(NEW.id::TEXT, ''),
    COALESCE(NEW.user_id::TEXT, ''),
    COALESCE(NEW.action, ''),
    COALESCE(NEW.table_name, ''),
    COALESCE(NEW.record_id::TEXT, ''),
    COALESCE(NEW.created_at::TEXT, '')
  );
  
  -- Gerar assinatura HMAC-SHA256
  NEW.signature := encode(
    hmac(v_data_to_sign::bytea, v_signing_key::bytea, 'sha256'),
    'hex'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para assinar logs automaticamente
DROP TRIGGER IF EXISTS sign_audit_log_trigger ON public.audit_logs;
CREATE TRIGGER sign_audit_log_trigger
BEFORE INSERT ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.sign_audit_log();

-- Criar função para verificar integridade de um log
CREATE OR REPLACE FUNCTION public.verify_audit_log_signature(p_log_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_log RECORD;
  v_data_to_sign TEXT;
  v_signing_key TEXT;
  v_computed_signature TEXT;
BEGIN
  -- Buscar o log
  SELECT * INTO v_log FROM public.audit_logs WHERE id = p_log_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Usar mesma chave
  v_signing_key := 'malta-audit-signing-key-2025';
  
  -- Reconstruir dados assinados
  v_data_to_sign := CONCAT(
    COALESCE(v_log.id::TEXT, ''),
    COALESCE(v_log.user_id::TEXT, ''),
    COALESCE(v_log.action, ''),
    COALESCE(v_log.table_name, ''),
    COALESCE(v_log.record_id::TEXT, ''),
    COALESCE(v_log.created_at::TEXT, '')
  );
  
  -- Calcular assinatura esperada
  v_computed_signature := encode(
    hmac(v_data_to_sign::bytea, v_signing_key::bytea, 'sha256'),
    'hex'
  );
  
  -- Comparar com a assinatura armazenada
  RETURN v_log.signature = v_computed_signature;
END;
$$;

-- Prevenir UPDATE em audit_logs (logs são imutáveis)
DROP POLICY IF EXISTS "No one can update audit logs" ON public.audit_logs;
CREATE POLICY "Audit logs are immutable - no updates allowed"
ON public.audit_logs FOR UPDATE
TO authenticated
USING (FALSE);

-- Prevenir DELETE em audit_logs (logs são permanentes)
DROP POLICY IF EXISTS "No one can delete audit logs" ON public.audit_logs;
CREATE POLICY "Audit logs are permanent - no deletions allowed"
ON public.audit_logs FOR DELETE
TO authenticated
USING (FALSE);

-- Criar view para admins verificarem integridade
CREATE OR REPLACE VIEW public.audit_logs_integrity_status AS
SELECT 
  id,
  user_email,
  action,
  table_name,
  created_at,
  signature IS NOT NULL as has_signature,
  CASE 
    WHEN signature IS NULL THEN 'NO_SIGNATURE'
    WHEN verify_audit_log_signature(id) THEN 'VALID'
    ELSE 'COMPROMISED'
  END as integrity_status
FROM public.audit_logs
ORDER BY created_at DESC;

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON COLUMN public.user_permissions.can_view_financial_data IS 
'Permissão específica para visualizar dados financeiros sensíveis (caixa, transações). Separada de can_access_assets.';

COMMENT ON COLUMN public.equipment_receipts.received_by_cpf_encrypted IS 
'CPF criptografado usando AES. O CPF em texto plano (received_by_cpf) é mantido para compatibilidade mas deve ser descontinuado.';

COMMENT ON TABLE public.receipt_access_logs IS 
'Auditoria de acessos a recibos para detectar acessos suspeitos a dados pessoais (CPF, assinatura digital).';

COMMENT ON COLUMN public.audit_logs.signature IS 
'Assinatura HMAC-SHA256 do log para garantir integridade. Logs não podem ser alterados após criação.';

COMMENT ON FUNCTION public.verify_audit_log_signature(UUID) IS 
'Verifica se a assinatura criptográfica de um audit log é válida. Retorna FALSE se o log foi adulterado.';

COMMENT ON VIEW public.audit_logs_integrity_status IS 
'View para admins verificarem integridade dos audit logs. Mostra quais logs têm assinatura válida ou foram comprometidos.';