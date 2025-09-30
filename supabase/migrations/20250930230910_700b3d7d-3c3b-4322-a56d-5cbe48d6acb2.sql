-- Etapa 1: Remover constraint antiga
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_location_type_check;