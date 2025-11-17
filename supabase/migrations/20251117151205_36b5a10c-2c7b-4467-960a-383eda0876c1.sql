-- Atualizar trigger para não validar quantidades de produtos não catalogados
-- Produtos não catalogados são apenas informativos e não têm controle de estoque

CREATE OR REPLACE FUNCTION validate_report_parts_quantity()
RETURNS TRIGGER AS $$
DECLARE
  v_withdrawal_quantity INTEGER;
  v_used_quantity INTEGER;
  v_product_id UUID;
  v_non_cataloged_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
  -- Se não há withdrawal_id, não validar (produto não vinculado a retirada)
  IF NEW.withdrawal_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar o product_id da retirada para verificar se é produto não catalogado
  SELECT product_id INTO v_product_id
  FROM material_withdrawals
  WHERE id = NEW.withdrawal_id;

  -- Se é produto não catalogado, não validar quantidade (apenas informativo)
  IF v_product_id = v_non_cataloged_id THEN
    RETURN NEW;
  END IF;

  -- Para produtos catalogados, validar quantidade normalmente
  SELECT quantity INTO v_withdrawal_quantity
  FROM material_withdrawals
  WHERE id = NEW.withdrawal_id;

  SELECT COALESCE(SUM(quantity_used), 0) INTO v_used_quantity
  FROM report_parts
  WHERE withdrawal_id = NEW.withdrawal_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

  IF (v_used_quantity + NEW.quantity_used) > v_withdrawal_quantity THEN
    RAISE EXCEPTION 'Quantidade usada (%) excede a quantidade retirada (%) para esta peça', 
      (v_used_quantity + NEW.quantity_used), v_withdrawal_quantity;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;