-- Adicionar novos campos para as opções de localização expandidas
ALTER TABLE public.assets 
  ADD COLUMN IF NOT EXISTS deposito_description TEXT,
  ADD COLUMN IF NOT EXISTS available_for_rental BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_company TEXT,
  ADD COLUMN IF NOT EXISTS maintenance_work_site TEXT,
  ADD COLUMN IF NOT EXISTS maintenance_description TEXT,
  ADD COLUMN IF NOT EXISTS is_new_equipment BOOLEAN DEFAULT true;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.assets.deposito_description IS 'Descrição adicional quando equipamento está no Depósito Malta';
COMMENT ON COLUMN public.assets.available_for_rental IS 'Indica se o equipamento está liberado para locação';
COMMENT ON COLUMN public.assets.maintenance_company IS 'Empresa onde está em manutenção';
COMMENT ON COLUMN public.assets.maintenance_work_site IS 'Obra onde está em manutenção';
COMMENT ON COLUMN public.assets.maintenance_description IS 'Descrição/motivo da manutenção';
COMMENT ON COLUMN public.assets.is_new_equipment IS 'Indica se o equipamento é novo ou usado';