-- ============================================
-- FASE 1: REMOVER COLUNA CPF NÃO-CRIPTOGRAFADA
-- ============================================
ALTER TABLE equipment_receipts 
DROP COLUMN IF EXISTS received_by_cpf;