-- ETAPA 1: Adicionar colunas para Saída para Locação e Depósito Malta

-- Adicionar colunas para fotos de locação (opcionais)
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS rental_photo_1 TEXT,
ADD COLUMN IF NOT EXISTS rental_photo_2 TEXT;

-- Adicionar colunas para Depósito Malta (opcionais)
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS was_washed BOOLEAN,
ADD COLUMN IF NOT EXISTS was_painted BOOLEAN;

-- Comentários para documentação
COMMENT ON COLUMN public.assets.rental_photo_1 IS 'URL da primeira foto para saída de locação';
COMMENT ON COLUMN public.assets.rental_photo_2 IS 'URL da segunda foto para saída de locação';
COMMENT ON COLUMN public.assets.was_washed IS 'Indica se o equipamento foi lavado ao retornar ao depósito';
COMMENT ON COLUMN public.assets.was_painted IS 'Indica se o equipamento foi pintado ao retornar ao depósito';