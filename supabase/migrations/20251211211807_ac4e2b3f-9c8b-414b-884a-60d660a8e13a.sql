-- =========================================================
-- MIGRAÇÃO: Criptografia de Nível de Campo para maintenance_plans
-- Protege CPFs com criptografia simétrica AES-256
-- =========================================================

-- 1. Garantir que a extensão pgcrypto está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Criar função para criptografar dados sensíveis
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(p_data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
  v_key TEXT;
BEGIN
  IF p_data IS NULL OR p_data = '' THEN
    RETURN NULL;
  END IF;
  
  -- Chave derivada do projeto para criptografia
  v_key := encode(extensions.digest('malta-stock-guardian-encryption-key-2025', 'sha256'), 'hex');
  
  -- Retorna dados criptografados em base64
  RETURN encode(
    extensions.pgp_sym_encrypt(
      p_data::bytea,
      v_key,
      'cipher-algo=aes256'
    ),
    'base64'
  );
END;
$$;

-- 3. Criar função para descriptografar dados sensíveis
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(p_encrypted_data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
  v_key TEXT;
  v_decrypted BYTEA;
BEGIN
  IF p_encrypted_data IS NULL OR p_encrypted_data = '' THEN
    RETURN NULL;
  END IF;
  
  -- Usa a mesma chave de criptografia
  v_key := encode(extensions.digest('malta-stock-guardian-encryption-key-2025', 'sha256'), 'hex');
  
  -- Descriptografa os dados
  BEGIN
    v_decrypted := extensions.pgp_sym_decrypt(
      decode(p_encrypted_data, 'base64'),
      v_key
    );
    RETURN convert_from(v_decrypted, 'UTF8');
  EXCEPTION WHEN OTHERS THEN
    -- Se falhar na descriptografia (dados legados não criptografados), retorna original
    RETURN p_encrypted_data;
  END;
END;
$$;

-- 4. Adicionar colunas criptografadas para CPFs
ALTER TABLE public.maintenance_plans 
ADD COLUMN IF NOT EXISTS client_cpf_encrypted TEXT,
ADD COLUMN IF NOT EXISTS technician_cpf_encrypted TEXT,
ADD COLUMN IF NOT EXISTS supervisor_cpf_encrypted TEXT;

-- 5. Migrar dados existentes para colunas criptografadas (CPFs)
UPDATE public.maintenance_plans
SET 
  client_cpf_encrypted = CASE 
    WHEN client_cpf IS NOT NULL AND client_cpf != '' AND client_cpf != '***PROTEGIDO***'
    THEN public.encrypt_sensitive_data(client_cpf)
    ELSE NULL 
  END,
  technician_cpf_encrypted = CASE 
    WHEN technician_cpf IS NOT NULL AND technician_cpf != '' AND technician_cpf != '***PROTEGIDO***'
    THEN public.encrypt_sensitive_data(technician_cpf)
    ELSE NULL 
  END,
  supervisor_cpf_encrypted = CASE 
    WHEN supervisor_cpf IS NOT NULL AND supervisor_cpf != '' AND supervisor_cpf != '***PROTEGIDO***'
    THEN public.encrypt_sensitive_data(supervisor_cpf)
    ELSE NULL 
  END
WHERE 
  (client_cpf IS NOT NULL AND client_cpf != '' AND client_cpf != '***PROTEGIDO***') OR
  (technician_cpf IS NOT NULL AND technician_cpf != '' AND technician_cpf != '***PROTEGIDO***') OR
  (supervisor_cpf IS NOT NULL AND supervisor_cpf != '' AND supervisor_cpf != '***PROTEGIDO***');

-- 6. Criar trigger para criptografar automaticamente novos dados de CPF
CREATE OR REPLACE FUNCTION public.encrypt_maintenance_plan_cpfs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Criptografar CPFs se fornecidos e não já mascarados
  IF NEW.client_cpf IS NOT NULL AND NEW.client_cpf != '' AND NEW.client_cpf != '***PROTEGIDO***' THEN
    NEW.client_cpf_encrypted := public.encrypt_sensitive_data(NEW.client_cpf);
    NEW.client_cpf := '***PROTEGIDO***'; -- Mascarar o campo original
  END IF;
  
  IF NEW.technician_cpf IS NOT NULL AND NEW.technician_cpf != '' AND NEW.technician_cpf != '***PROTEGIDO***' THEN
    NEW.technician_cpf_encrypted := public.encrypt_sensitive_data(NEW.technician_cpf);
    NEW.technician_cpf := '***PROTEGIDO***';
  END IF;
  
  IF NEW.supervisor_cpf IS NOT NULL AND NEW.supervisor_cpf != '' AND NEW.supervisor_cpf != '***PROTEGIDO***' THEN
    NEW.supervisor_cpf_encrypted := public.encrypt_sensitive_data(NEW.supervisor_cpf);
    NEW.supervisor_cpf := '***PROTEGIDO***';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS encrypt_maintenance_cpfs_trigger ON public.maintenance_plans;
CREATE TRIGGER encrypt_maintenance_cpfs_trigger
  BEFORE INSERT OR UPDATE ON public.maintenance_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_maintenance_plan_cpfs();

-- 7. Mascarar CPFs originais que já foram migrados
UPDATE public.maintenance_plans
SET 
  client_cpf = CASE WHEN client_cpf_encrypted IS NOT NULL THEN '***PROTEGIDO***' ELSE client_cpf END,
  technician_cpf = CASE WHEN technician_cpf_encrypted IS NOT NULL THEN '***PROTEGIDO***' ELSE technician_cpf END,
  supervisor_cpf = CASE WHEN supervisor_cpf_encrypted IS NOT NULL THEN '***PROTEGIDO***' ELSE supervisor_cpf END
WHERE 
  client_cpf_encrypted IS NOT NULL OR
  technician_cpf_encrypted IS NOT NULL OR
  supervisor_cpf_encrypted IS NOT NULL;

-- 8. Adicionar comentários para documentação
COMMENT ON TABLE public.maintenance_plans IS 'Planos de manutenção com dados sensíveis criptografados. CPFs armazenados em *_cpf_encrypted usando AES-256. Campos originais de CPF contêm apenas máscara.';
COMMENT ON COLUMN public.maintenance_plans.client_cpf_encrypted IS 'CPF do cliente criptografado com AES-256 via pgcrypto';
COMMENT ON COLUMN public.maintenance_plans.technician_cpf_encrypted IS 'CPF do técnico criptografado com AES-256 via pgcrypto';
COMMENT ON COLUMN public.maintenance_plans.supervisor_cpf_encrypted IS 'CPF do supervisor criptografado com AES-256 via pgcrypto';