-- Corrigir função de decremento de estoque para ignorar produto não catalogado
CREATE OR REPLACE FUNCTION public.decrease_stock_on_withdrawal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ignorar produto "NAO-CATALOGADO" (não controla estoque)
  IF NEW.product_id = '00000000-0000-0000-0000-000000000001' THEN
    RETURN NEW;
  END IF;

  -- Atualizar estoque normalmente para outros produtos
  UPDATE public.products
  SET quantity = quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$;

-- Corrigir validação de estoque para permitir -1 no produto não catalogado
CREATE OR REPLACE FUNCTION public.validate_stock_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permitir quantidade -1 para produto "NAO-CATALOGADO" (flag especial)
  IF NEW.id = '00000000-0000-0000-0000-000000000001' AND NEW.quantity = -1 THEN
    RETURN NEW;
  END IF;

  -- Validar que quantidade não fica negativa para outros produtos
  IF NEW.quantity < 0 THEN
    RAISE EXCEPTION 'Quantidade em estoque não pode ser negativa. Produto: %, Tentativa: %', 
      (SELECT name FROM public.products WHERE id = NEW.id), NEW.quantity;
  END IF;
  
  RETURN NEW;
END;
$$;