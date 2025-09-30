-- Etapa 2: Atualizar registros antigos e adicionar constraint correta
UPDATE assets 
SET location_type = 'deposito_malta' 
WHERE location_type = 'escritorio';

-- Adicionar constraint com os valores corretos
ALTER TABLE assets ADD CONSTRAINT assets_location_type_check 
  CHECK (location_type IN ('deposito_malta', 'liberado_locacao', 'em_manutencao', 'locacao'));