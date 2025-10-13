-- Criar tabela de equipamentos locados
CREATE TABLE public.rental_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_company_id UUID REFERENCES public.rental_companies(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id),
  asset_code TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  return_date DATE,
  daily_rate NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.rental_equipment ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (apenas admins)
CREATE POLICY "Only admins can view rental equipment"
ON public.rental_equipment
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert rental equipment"
ON public.rental_equipment
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update rental equipment"
ON public.rental_equipment
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete rental equipment"
ON public.rental_equipment
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Índices para performance
CREATE INDEX idx_rental_equipment_company ON public.rental_equipment(rental_company_id);
CREATE INDEX idx_rental_equipment_asset ON public.rental_equipment(asset_id);

-- Trigger para updated_at
CREATE TRIGGER update_rental_equipment_updated_at
BEFORE UPDATE ON public.rental_equipment
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();