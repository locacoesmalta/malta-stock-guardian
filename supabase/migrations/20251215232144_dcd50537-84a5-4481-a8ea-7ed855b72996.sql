-- Allow contract_end_date to be NULL for indeterminate contracts
ALTER TABLE rental_companies 
  ALTER COLUMN contract_end_date DROP NOT NULL;

-- Allow asset_code to be NULL for equipment without PAT
ALTER TABLE rental_equipment 
  ALTER COLUMN asset_code DROP NOT NULL;