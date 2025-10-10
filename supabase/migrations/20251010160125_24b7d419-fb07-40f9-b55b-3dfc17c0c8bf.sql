-- Adicionar coluna para referenciar assets na tabela de mobilização
ALTER TABLE public.asset_mobilization_parts
ADD COLUMN mobilization_asset_id uuid REFERENCES public.assets(id) ON DELETE CASCADE;

-- Modificar constraint para permitir product_id OU mobilization_asset_id
ALTER TABLE public.asset_mobilization_parts
DROP CONSTRAINT IF EXISTS asset_mobilization_parts_product_id_fkey;

ALTER TABLE public.asset_mobilization_parts
ALTER COLUMN product_id DROP NOT NULL;

-- Adicionar constraint para garantir que pelo menos um dos dois seja preenchido
ALTER TABLE public.asset_mobilization_parts
ADD CONSTRAINT check_product_or_asset 
CHECK (
  (product_id IS NOT NULL AND mobilization_asset_id IS NULL) OR
  (product_id IS NULL AND mobilization_asset_id IS NOT NULL)
);

-- Criar índice para melhor performance
CREATE INDEX idx_asset_mobilization_parts_mobilization_asset 
ON public.asset_mobilization_parts(mobilization_asset_id);