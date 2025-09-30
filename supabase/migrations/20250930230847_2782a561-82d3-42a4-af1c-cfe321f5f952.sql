-- 1. Remover constraint antiga primeiro
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_location_type_check;

-- 2. Atualizar registros antigos
UPDATE assets 
SET location_type = 'deposito_malta' 
WHERE location_type = 'escritorio';

-- 3. Adicionar constraint correta
ALTER TABLE assets ADD CONSTRAINT assets_location_type_check 
  CHECK (location_type IN ('deposito_malta', 'liberado_locacao', 'em_manutencao', 'locacao'));