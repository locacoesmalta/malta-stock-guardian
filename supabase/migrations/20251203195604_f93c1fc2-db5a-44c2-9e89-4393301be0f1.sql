-- Adicionar coluna retroactive_justification na tabela maintenance_plans
ALTER TABLE public.maintenance_plans 
ADD COLUMN IF NOT EXISTS retroactive_justification text;

-- Comentário descritivo
COMMENT ON COLUMN public.maintenance_plans.retroactive_justification IS 
  'Justificativa obrigatória quando a data do plano é retroativa (>7 dias no passado)';