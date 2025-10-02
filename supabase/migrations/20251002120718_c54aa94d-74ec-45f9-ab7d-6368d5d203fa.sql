-- Remover a constraint antiga que está limitando os valores
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_location_type_check;

-- Criar nova constraint com todos os valores necessários incluindo aguardando_laudo
ALTER TABLE public.assets ADD CONSTRAINT assets_location_type_check 
  CHECK (location_type IN (
    'deposito_malta',
    'liberado_locacao', 
    'em_manutencao',
    'locacao',
    'aguardando_laudo'
  ));