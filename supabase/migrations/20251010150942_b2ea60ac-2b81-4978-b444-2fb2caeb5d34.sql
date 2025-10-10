-- Criar tabela de peças de reposição (estoque futuro)
CREATE TABLE public.asset_spare_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  notes text,
  registered_by uuid NOT NULL REFERENCES auth.users(id),
  registered_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela de peças de mobilização (custos)
CREATE TABLE public.asset_mobilization_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_cost numeric(10,2) NOT NULL CHECK (unit_cost > 0),
  total_cost numeric(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  purchase_date date NOT NULL,
  notes text,
  registered_by uuid NOT NULL REFERENCES auth.users(id),
  registered_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_asset_spare_parts_asset_id ON public.asset_spare_parts(asset_id);
CREATE INDEX idx_asset_mobilization_parts_asset_id ON public.asset_mobilization_parts(asset_id);

-- Habilitar RLS
ALTER TABLE public.asset_spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_mobilization_parts ENABLE ROW LEVEL SECURITY;

-- RLS Policies para asset_spare_parts
CREATE POLICY "Users with permission can view spare parts"
  ON public.asset_spare_parts FOR SELECT
  USING (can_user_access_assets(auth.uid()));

CREATE POLICY "Users with permission can insert spare parts"
  ON public.asset_spare_parts FOR INSERT
  WITH CHECK (can_user_edit_assets(auth.uid()) AND registered_by = auth.uid());

CREATE POLICY "Users with permission can delete spare parts"
  ON public.asset_spare_parts FOR DELETE
  USING (can_user_delete_assets(auth.uid()));

-- RLS Policies para asset_mobilization_parts
CREATE POLICY "Users with permission can view mobilization parts"
  ON public.asset_mobilization_parts FOR SELECT
  USING (can_user_access_assets(auth.uid()));

CREATE POLICY "Users with permission can insert mobilization parts"
  ON public.asset_mobilization_parts FOR INSERT
  WITH CHECK (can_user_edit_assets(auth.uid()) AND registered_by = auth.uid());

CREATE POLICY "Users with permission can delete mobilization parts"
  ON public.asset_mobilization_parts FOR DELETE
  USING (can_user_delete_assets(auth.uid()));

-- Criar triggers para updated_at
CREATE TRIGGER update_asset_spare_parts_updated_at
  BEFORE UPDATE ON public.asset_spare_parts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_mobilization_parts_updated_at
  BEFORE UPDATE ON public.asset_mobilization_parts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();