-- Adicionar controle de ciclo de vida em material_withdrawals
ALTER TABLE public.material_withdrawals
ADD COLUMN IF NOT EXISTS lifecycle_cycle INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_material_withdrawals_lifecycle 
ON public.material_withdrawals(equipment_code, lifecycle_cycle, is_archived);

-- Criar tabela para registrar histórico de ciclos
CREATE TABLE IF NOT EXISTS public.asset_lifecycle_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  asset_code TEXT NOT NULL,
  cycle_number INTEGER NOT NULL,
  cycle_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cycle_closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  archived_withdrawals_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para asset_lifecycle_history
CREATE INDEX IF NOT EXISTS idx_lifecycle_history_asset_code 
ON public.asset_lifecycle_history(asset_code, cycle_number);

-- RLS para lifecycle_history
ALTER TABLE public.asset_lifecycle_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view lifecycle history" ON public.asset_lifecycle_history;
CREATE POLICY "Users can view lifecycle history"
ON public.asset_lifecycle_history FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert lifecycle history" ON public.asset_lifecycle_history;
CREATE POLICY "Users can insert lifecycle history"
ON public.asset_lifecycle_history FOR INSERT
TO authenticated
WITH CHECK (can_user_create_withdrawals(auth.uid()));