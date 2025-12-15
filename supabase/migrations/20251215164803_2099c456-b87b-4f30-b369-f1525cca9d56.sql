-- Adicionar coluna de localização física na tabela assets
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS physical_location TEXT;

COMMENT ON COLUMN public.assets.physical_location IS 'Localização física/cidade do equipamento (ex: Belém, Marabá, Tucuruí)';