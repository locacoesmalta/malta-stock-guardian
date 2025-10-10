-- Remove o check constraint antigo do campo voltage_combustion
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_voltage_combustion_check;