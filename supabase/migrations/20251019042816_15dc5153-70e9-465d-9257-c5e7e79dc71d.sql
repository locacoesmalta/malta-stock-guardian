-- Adicionar campo de CPF no comprovante de equipamentos
ALTER TABLE public.equipment_receipts 
ADD COLUMN received_by_cpf TEXT;

-- Tornar o campo obrigatório (após adicionar o campo vazio)
-- Em produção, você precisará preencher os registros existentes antes de tornar NOT NULL
COMMENT ON COLUMN public.equipment_receipts.received_by_cpf IS 'CPF da pessoa que recebeu (11 dígitos obrigatório)';