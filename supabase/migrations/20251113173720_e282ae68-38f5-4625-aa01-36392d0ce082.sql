-- Adicionar campo substitution_date para rastrear quando equipamento saiu do depósito para substituir outro
ALTER TABLE assets 
ADD COLUMN substitution_date DATE;

COMMENT ON COLUMN assets.substitution_date IS 
'Data em que o equipamento saiu do depósito para substituir outro equipamento. Diferente de created_at (data de cadastro no sistema).';
