-- Adicionar campo rental_contract_number à tabela assets
ALTER TABLE public.assets 
ADD COLUMN rental_contract_number TEXT;