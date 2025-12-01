-- Dropar função antiga e recriar com novos campos
DROP FUNCTION IF EXISTS public.check_products_integrity();

CREATE FUNCTION public.check_products_integrity()
RETURNS TABLE(
  product_id uuid, 
  product_code text, 
  product_name text, 
  current_quantity integer, 
  has_adjustment_history boolean, 
  issue_type text,
  created_by_name text,
  created_by_email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.code,
    p.name,
    p.quantity,
    EXISTS(SELECT 1 FROM product_stock_adjustments WHERE product_id = p.id) as has_adjustment_history,
    CASE 
      WHEN p.quantity > 0 AND NOT EXISTS(SELECT 1 FROM product_stock_adjustments WHERE product_id = p.id) 
        THEN 'Estoque sem histórico'
      WHEN p.quantity < 0 
        THEN 'Estoque negativo'
      ELSE 'OK'
    END as issue_type,
    prof.full_name as created_by_name,
    prof.email as created_by_email
  FROM products p
  LEFT JOIN profiles prof ON prof.id = p.created_by
  WHERE p.deleted_at IS NULL
    AND (
      (p.quantity > 0 AND NOT EXISTS(SELECT 1 FROM product_stock_adjustments WHERE product_id = p.id))
      OR p.quantity < 0
    );
$function$;