-- PARTE 2: Criar função e tabela de ajustes de estoque

-- Criar função helper para verificar se usuário é superuser
CREATE OR REPLACE FUNCTION public.is_superuser(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'superuser'
  )
$$;

COMMENT ON FUNCTION public.is_superuser IS 'Verifica se um usuário tem a role de superuser';

-- Criar tabela para registrar ajustes manuais de quantidade
CREATE TABLE IF NOT EXISTS public.product_stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  adjusted_by UUID NOT NULL REFERENCES auth.users(id),
  adjustment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  
  reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT quantity_change_check CHECK (quantity_change = new_quantity - previous_quantity)
);

-- Índices para performance
CREATE INDEX idx_stock_adjustments_product ON public.product_stock_adjustments(product_id);
CREATE INDEX idx_stock_adjustments_user ON public.product_stock_adjustments(adjusted_by);
CREATE INDEX idx_stock_adjustments_date ON public.product_stock_adjustments(adjustment_date DESC);

-- RLS Policies
ALTER TABLE public.product_stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Apenas superusers e admins podem inserir ajustes
CREATE POLICY "Superusers e admins podem inserir ajustes"
  ON public.product_stock_adjustments FOR INSERT
  WITH CHECK (public.is_superuser(auth.uid()) OR public.is_admin(auth.uid()));

-- Apenas superusers e admins podem visualizar ajustes
CREATE POLICY "Superusers e admins podem visualizar ajustes"
  ON public.product_stock_adjustments FOR SELECT
  USING (public.is_superuser(auth.uid()) OR public.is_admin(auth.uid()));

-- Comentários
COMMENT ON TABLE public.product_stock_adjustments IS 'Registra todos os ajustes manuais de quantidade de estoque realizados por superusers';
COMMENT ON COLUMN public.product_stock_adjustments.quantity_change IS 'Diferença entre new_quantity e previous_quantity (positivo = aumento, negativo = redução)';