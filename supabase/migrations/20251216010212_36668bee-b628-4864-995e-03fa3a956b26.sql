-- Criar tabela de histórico de equipamentos por contrato
CREATE TABLE IF NOT EXISTS public.rental_equipment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_company_id UUID NOT NULL REFERENCES rental_companies(id) ON DELETE CASCADE,
  rental_equipment_id UUID REFERENCES rental_equipment(id) ON DELETE SET NULL,
  
  -- Equipamento que SAIU (original)
  original_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  original_asset_code TEXT NOT NULL,
  original_equipment_name TEXT NOT NULL,
  
  -- Equipamento que ENTROU (substituto)
  substitute_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  substitute_asset_code TEXT,
  substitute_equipment_name TEXT,
  
  -- Datas importantes
  original_pickup_date DATE NOT NULL,
  substitution_date DATE,
  association_end_date DATE,
  
  -- Contexto
  substitution_reason TEXT,
  work_site TEXT,
  current_status TEXT DEFAULT 'aguardando_laudo',
  
  -- Tipo de evento
  event_type TEXT NOT NULL CHECK (event_type IN ('ORIGINAL', 'SUBSTITUTION', 'RETURN')),
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  notes TEXT
);

-- Adicionar campos na tabela rental_equipment
ALTER TABLE rental_equipment ADD COLUMN IF NOT EXISTS substitution_date DATE;
ALTER TABLE rental_equipment ADD COLUMN IF NOT EXISTS substituted_from_asset_id UUID REFERENCES assets(id);
ALTER TABLE rental_equipment ADD COLUMN IF NOT EXISTS substitution_count INTEGER DEFAULT 0;

-- Habilitar RLS
ALTER TABLE rental_equipment_history ENABLE ROW LEVEL SECURITY;

-- Policies para rental_equipment_history
CREATE POLICY "Users can view rental equipment history"
ON rental_equipment_history FOR SELECT
USING (is_user_active(auth.uid()));

CREATE POLICY "Users can insert rental equipment history"
ON rental_equipment_history FOR INSERT
WITH CHECK (is_user_active(auth.uid()));

CREATE POLICY "Users can update rental equipment history"
ON rental_equipment_history FOR UPDATE
USING (is_user_active(auth.uid()));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_rental_equipment_history_company ON rental_equipment_history(rental_company_id);
CREATE INDEX IF NOT EXISTS idx_rental_equipment_history_original_asset ON rental_equipment_history(original_asset_id);
CREATE INDEX IF NOT EXISTS idx_rental_equipment_history_substitute_asset ON rental_equipment_history(substitute_asset_id);