-- ============================================
-- CORREÇÃO 5B: Adicionar valores antigos de location_type ao constraint
-- ============================================

-- O sistema estava usando valores diferentes dos definidos no constraint.
-- Adicionando valores antigos para manter compatibilidade com dados existentes.

ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_location_type_check;

ALTER TABLE public.assets ADD CONSTRAINT assets_location_type_check
CHECK (location_type IN (
  -- Valores novos (padrão)
  'em_obra',
  'em_manutencao',
  'no_deposito',
  'em_locacao',
  'disponivel',
  'em_transito',
  'inspecao_pos_manutencao',
  -- Valores antigos (compatibilidade)
  'deposito_malta',      -- equivalente a 'no_deposito'
  'liberado_locacao',    -- equivalente a 'disponivel'
  'aguardando_laudo',    -- equivalente a 'inspecao_pos_manutencao'
  'locacao'              -- equivalente a 'em_locacao'
));

-- Comentário documentando valores válidos
COMMENT ON COLUMN public.assets.location_type IS 
'Valores válidos (novos): em_obra, em_manutencao, no_deposito, em_locacao, disponivel, em_transito, inspecao_pos_manutencao
Valores antigos (compatibilidade): deposito_malta, liberado_locacao, aguardando_laudo, locacao';