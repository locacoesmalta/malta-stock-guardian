-- Remover constraint antiga que só aceita '15' e '30'
ALTER TABLE rental_companies 
  DROP CONSTRAINT IF EXISTS rental_companies_contract_type_check;

-- Criar nova constraint que aceita '15', '30' e 'indeterminado'
ALTER TABLE rental_companies 
  ADD CONSTRAINT rental_companies_contract_type_check 
  CHECK (contract_type IN ('15', '30', 'indeterminado'));