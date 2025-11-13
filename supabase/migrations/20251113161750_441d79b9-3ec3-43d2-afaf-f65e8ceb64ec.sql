-- ============================================
-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA (Versão Idempotente)
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

-- Políticas para receipt_access_logs
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Only admins can view receipt access logs" ON public.receipt_access_logs;
  CREATE POLICY "Only admins can view receipt access logs"
  ON public.receipt_access_logs FOR SELECT
  TO authenticated
  USING (is_admin_or_superuser(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "System can insert receipt access logs" ON public.receipt_access_logs;
  CREATE POLICY "System can insert receipt access logs"
  ON public.receipt_access_logs FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
  v_encryption_key := 'malta-cpf-encryption-key-2025-secure';
  
  IF NEW.received_by_cpf IS NOT NULL AND NEW.received_by_cpf != '' THEN
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
  v_signing_key := 'malta-audit-signing-key-2025';
  
  v_data_to_sign := CONCAT(
    COALESCE(NEW.id::TEXT, ''),
    COALESCE(NEW.user_id::TEXT, ''),
    COALESCE(NEW.action, ''),
    COALESCE(NEW.table_name, ''),
    COALESCE(NEW.record_id::TEXT, ''),
    COALESCE(NEW.created_at::TEXT, '')
  );
  
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

-- Criar função para verificar integridade
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
  SELECT * INTO v_log FROM public.audit_logs WHERE id = p_log_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  v_signing_key := 'malta-audit-signing-key-2025';
  
  v_data_to_sign := CONCAT(
    COALESCE(v_log.id::TEXT, ''),
    COALESCE(v_log.user_id::TEXT, ''),
    COALESCE(v_log.action, ''),
    COALESCE(v_log.table_name, ''),
    COALESCE(v_log.record_id::TEXT, ''),
    COALESCE(v_log.created_at::TEXT, '')
  );
  
  v_computed_signature := encode(
    hmac(v_data_to_sign::bytea, v_signing_key::bytea, 'sha256'),
    'hex'
  );
  
  RETURN v_log.signature = v_computed_signature;
END;
$$;

-- Políticas de imutabilidade para audit_logs
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Audit logs are immutable - no updates allowed" ON public.audit_logs;
  CREATE POLICY "Audit logs are immutable - no updates allowed"
  ON public.audit_logs FOR UPDATE
  TO authenticated
  USING (FALSE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Audit logs are permanent - no deletions allowed" ON public.audit_logs;
  CREATE POLICY "Audit logs are permanent - no deletions allowed"
  ON public.audit_logs FOR DELETE
  TO authenticated
  USING (FALSE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Criar view para verificar integridade
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