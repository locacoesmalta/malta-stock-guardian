-- Remove o trigger e função que davam baixa no estoque ao criar relatório
DROP TRIGGER IF EXISTS decrease_stock_on_report_trigger ON public.reports;
DROP TRIGGER IF EXISTS on_report_created ON public.reports;
DROP FUNCTION IF EXISTS public.decrease_stock_on_report() CASCADE;

-- Modificar tabela reports para focar em equipamento (PAT)
ALTER TABLE public.reports DROP COLUMN IF EXISTS product_id;
ALTER TABLE public.reports DROP COLUMN IF EXISTS quantity_used;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS equipment_code TEXT NOT NULL DEFAULT '';
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS equipment_name TEXT;

-- Criar tabela para peças usadas no relatório
CREATE TABLE IF NOT EXISTS public.report_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_parts ENABLE ROW LEVEL SECURITY;

-- Políticas para report_parts
DROP POLICY IF EXISTS "Everyone can view report parts" ON public.report_parts;
CREATE POLICY "Everyone can view report parts"
ON public.report_parts
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create report parts" ON public.report_parts;
CREATE POLICY "Authenticated users can create report parts"
ON public.report_parts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reports
    WHERE reports.id = report_parts.report_id
    AND reports.created_by = auth.uid()
  )
);

-- Criar tabela para retiradas de material
CREATE TABLE IF NOT EXISTS public.material_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  withdrawn_by UUID NOT NULL REFERENCES auth.users(id),
  withdrawal_reason TEXT,
  withdrawal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.material_withdrawals ENABLE ROW LEVEL SECURITY;

-- Políticas para material_withdrawals
DROP POLICY IF EXISTS "Everyone can view withdrawals" ON public.material_withdrawals;
CREATE POLICY "Everyone can view withdrawals"
ON public.material_withdrawals
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create withdrawals" ON public.material_withdrawals;
CREATE POLICY "Authenticated users can create withdrawals"
ON public.material_withdrawals
FOR INSERT
WITH CHECK (auth.uid() = withdrawn_by);

DROP POLICY IF EXISTS "Only admins can delete withdrawals" ON public.material_withdrawals;
CREATE POLICY "Only admins can delete withdrawals"
ON public.material_withdrawals
FOR DELETE
USING (is_admin(auth.uid()));

-- Trigger para dar baixa no estoque quando há retirada de material
CREATE OR REPLACE FUNCTION public.decrease_stock_on_withdrawal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET quantity = quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS decrease_stock_on_withdrawal_trigger ON public.material_withdrawals;
CREATE TRIGGER decrease_stock_on_withdrawal_trigger
AFTER INSERT ON public.material_withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.decrease_stock_on_withdrawal();

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_report_parts_report_id ON public.report_parts(report_id);
CREATE INDEX IF NOT EXISTS idx_report_parts_product_id ON public.report_parts(product_id);
CREATE INDEX IF NOT EXISTS idx_material_withdrawals_product_id ON public.material_withdrawals(product_id);
CREATE INDEX IF NOT EXISTS idx_material_withdrawals_date ON public.material_withdrawals(withdrawal_date);