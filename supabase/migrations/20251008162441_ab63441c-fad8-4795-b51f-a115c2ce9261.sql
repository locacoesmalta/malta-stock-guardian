-- Criar tabela de histórico de compras de produtos
CREATE TABLE IF NOT EXISTS public.product_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  purchase_date DATE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  purchase_price NUMERIC CHECK (purchase_price >= 0),
  sale_price NUMERIC CHECK (sale_price >= 0),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('Faturado', 'Caixa', 'Nivaldo', 'Sabrina')),
  operator_id UUID REFERENCES auth.users(id),
  operator_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_product_purchases_product_id ON public.product_purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_product_purchases_date ON public.product_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_product_purchases_payment_type ON public.product_purchases(payment_type);

-- Adicionar novos campos na tabela products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS last_purchase_date DATE,
ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('Faturado', 'Caixa', 'Nivaldo', 'Sabrina'));

-- Criar função para atualizar última compra automaticamente
CREATE OR REPLACE FUNCTION public.update_product_last_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products 
  SET last_purchase_date = NEW.purchase_date,
      payment_type = NEW.payment_type,
      updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_last_purchase ON public.product_purchases;
CREATE TRIGGER trigger_update_last_purchase
AFTER INSERT ON public.product_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_product_last_purchase();

-- Habilitar RLS
ALTER TABLE public.product_purchases ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para product_purchases
CREATE POLICY "Users can view purchases if they can view products"
ON public.product_purchases FOR SELECT
USING (can_user_view_products(auth.uid()));

CREATE POLICY "Users can insert purchases if they can edit products"
ON public.product_purchases FOR INSERT
WITH CHECK (can_user_edit_products(auth.uid()));

-- Trigger para updated_at em product_purchases
CREATE TRIGGER update_product_purchases_updated_at
BEFORE UPDATE ON public.product_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();