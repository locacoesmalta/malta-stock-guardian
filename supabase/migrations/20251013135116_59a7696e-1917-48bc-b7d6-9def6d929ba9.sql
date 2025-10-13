-- Create table for mobilization expenses (travel and shipment)
CREATE TABLE public.asset_mobilization_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  expense_type text NOT NULL CHECK (expense_type IN ('travel', 'shipment')),
  value numeric NOT NULL CHECK (value > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  registered_by uuid NOT NULL,
  
  -- Campos para Despesa de Viagem
  collaborator_name text,
  travel_date date,
  return_date date,
  
  -- Campos para Envio de Equipamento
  sent_by text,
  shipment_date date,
  received_by text
);

-- Enable RLS
ALTER TABLE public.asset_mobilization_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (seguindo o padrão de asset_mobilization_parts)
CREATE POLICY "Users with permission can view mobilization expenses"
  ON public.asset_mobilization_expenses
  FOR SELECT
  USING (can_user_access_assets(auth.uid()));

CREATE POLICY "Users with permission can insert mobilization expenses"
  ON public.asset_mobilization_expenses
  FOR INSERT
  WITH CHECK (can_user_edit_assets(auth.uid()) AND registered_by = auth.uid());

CREATE POLICY "Users with permission can delete mobilization expenses"
  ON public.asset_mobilization_expenses
  FOR DELETE
  USING (can_user_delete_assets(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_asset_mobilization_expenses_updated_at
  BEFORE UPDATE ON public.asset_mobilization_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_asset_mobilization_expenses_asset_id ON public.asset_mobilization_expenses(asset_id);
CREATE INDEX idx_asset_mobilization_expenses_registered_by ON public.asset_mobilization_expenses(registered_by);