-- Adicionar coluna retroactive_justification para armazenar justificativas de movimentações retroativas
-- Esta coluna é diferente de retroactive_registration_notes (usado para cadastro inicial)
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS retroactive_justification TEXT NULL;

COMMENT ON COLUMN public.assets.retroactive_justification IS 'Justificativa para movimentações retroativas (manutenção, locação, retornos) com datas > 7 dias no passado';