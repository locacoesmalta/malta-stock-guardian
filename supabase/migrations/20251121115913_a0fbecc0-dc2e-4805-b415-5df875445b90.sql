-- FASE 1: PERMITIR ESTOQUE NEGATIVO COM RASTREABILIDADE

-- 1.1 Modificar função validate_stock_quantity para permitir estoque negativo
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

  -- ✅ NOVO: Permitir estoque negativo para outros produtos
  -- (sem lançar exceção, apenas retornar)
  -- Isso permite movimentações retroativas
  RETURN NEW;
END;
$$;

-- 1.2 Adicionar coluna negative_stock_reason em material_withdrawals
ALTER TABLE public.material_withdrawals
ADD COLUMN IF NOT EXISTS negative_stock_reason TEXT;

COMMENT ON COLUMN public.material_withdrawals.negative_stock_reason IS 
'Justificativa obrigatória quando retirada causou estoque negativo. Registra movimentações retroativas.';

-- 1.3 Criar função de auditoria para estoque negativo
CREATE OR REPLACE FUNCTION public.log_negative_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_name TEXT;
  v_product_code TEXT;
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  -- Se estoque ficou negativo (mudou de >= 0 para < 0)
  IF OLD.quantity >= 0 AND NEW.quantity < 0 THEN
    -- Buscar informações do produto
    SELECT name, code INTO v_product_name, v_product_code
    FROM public.products WHERE id = NEW.id;
    
    -- Buscar informações do usuário
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM public.profiles WHERE id = auth.uid();
    
    -- Registrar em audit_logs
    INSERT INTO public.audit_logs (
      user_id,
      user_email,
      user_name,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      inserted_by_trigger
    ) VALUES (
      auth.uid(),
      COALESCE(v_user_email, 'unknown'),
      v_user_name,
      'NEGATIVE_STOCK',
      'products',
      NEW.id,
      jsonb_build_object(
        'quantity', OLD.quantity, 
        'product_name', v_product_name, 
        'product_code', v_product_code
      ),
      jsonb_build_object(
        'quantity', NEW.quantity, 
        'product_name', v_product_name, 
        'product_code', v_product_code
      ),
      'log_negative_stock'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para log automático de estoque negativo
DROP TRIGGER IF EXISTS trigger_log_negative_stock ON public.products;
CREATE TRIGGER trigger_log_negative_stock
  AFTER UPDATE ON public.products
  FOR EACH ROW
  WHEN (NEW.quantity IS DISTINCT FROM OLD.quantity)
  EXECUTE FUNCTION public.log_negative_stock();