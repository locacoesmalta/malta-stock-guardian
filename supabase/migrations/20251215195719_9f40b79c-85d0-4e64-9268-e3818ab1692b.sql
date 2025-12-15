-- Tabela de Medições
CREATE TABLE public.rental_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_company_id UUID NOT NULL REFERENCES rental_companies(id) ON DELETE CASCADE,
  measurement_number INTEGER NOT NULL,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_days INTEGER NOT NULL,
  
  subtotal_rentals NUMERIC DEFAULT 0,
  subtotal_demobilization NUMERIC DEFAULT 0,
  subtotal_maintenance NUMERIC DEFAULT 0,
  total_value NUMERIC DEFAULT 0,
  
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(rental_company_id, measurement_number)
);

-- Tabela de Itens da Medição
CREATE TABLE public.rental_measurement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id UUID NOT NULL REFERENCES rental_measurements(id) ON DELETE CASCADE,
  rental_equipment_id UUID REFERENCES rental_equipment(id),
  
  category TEXT NOT NULL CHECK (category IN ('rentals', 'demobilization', 'maintenance')),
  item_order INTEGER NOT NULL,
  
  equipment_code TEXT,
  description TEXT NOT NULL,
  unit TEXT DEFAULT 'UN',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  
  period_start DATE,
  period_end DATE,
  days_count INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rental_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_measurement_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rental_measurements
CREATE POLICY "Users with permission can view measurements"
ON public.rental_measurements FOR SELECT
USING (is_user_active(auth.uid()));

CREATE POLICY "Users with permission can insert measurements"
ON public.rental_measurements FOR INSERT
WITH CHECK (is_user_active(auth.uid()));

CREATE POLICY "Users with permission can update measurements"
ON public.rental_measurements FOR UPDATE
USING (is_user_active(auth.uid()));

CREATE POLICY "Admins can delete measurements"
ON public.rental_measurements FOR DELETE
USING (is_admin_or_superuser(auth.uid()));

-- RLS Policies for rental_measurement_items
CREATE POLICY "Users with permission can view measurement items"
ON public.rental_measurement_items FOR SELECT
USING (is_user_active(auth.uid()));

CREATE POLICY "Users with permission can insert measurement items"
ON public.rental_measurement_items FOR INSERT
WITH CHECK (is_user_active(auth.uid()));

CREATE POLICY "Users with permission can update measurement items"
ON public.rental_measurement_items FOR UPDATE
USING (is_user_active(auth.uid()));

CREATE POLICY "Users with permission can delete measurement items"
ON public.rental_measurement_items FOR DELETE
USING (is_user_active(auth.uid()));

-- Function para próximo número de medição por empresa
CREATE OR REPLACE FUNCTION public.get_next_measurement_number(p_company_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(MAX(measurement_number), 0) + 1
  FROM rental_measurements
  WHERE rental_company_id = p_company_id;
$$;

-- Indexes para performance
CREATE INDEX idx_rental_measurements_company ON rental_measurements(rental_company_id);
CREATE INDEX idx_rental_measurement_items_measurement ON rental_measurement_items(measurement_id);
CREATE INDEX idx_rental_measurement_items_category ON rental_measurement_items(category);