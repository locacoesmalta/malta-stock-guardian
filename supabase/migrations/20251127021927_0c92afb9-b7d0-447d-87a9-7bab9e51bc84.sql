-- ========================================
-- TRIGGER: Auto-atualização de available_for_rental baseado em location_type
-- ========================================

-- Função que atualiza available_for_rental automaticamente
CREATE OR REPLACE FUNCTION update_available_for_rental()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se location_type mudou ou é INSERT
  IF TG_OP = 'INSERT' OR OLD.location_type IS DISTINCT FROM NEW.location_type THEN
    -- Disponível APENAS quando está no Depósito Malta
    NEW.available_for_rental := (NEW.location_type = 'deposito_malta');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger que executa antes de INSERT ou UPDATE
DROP TRIGGER IF EXISTS trigger_update_available_for_rental ON assets;

CREATE TRIGGER trigger_update_available_for_rental
BEFORE INSERT OR UPDATE ON assets
FOR EACH ROW
EXECUTE FUNCTION update_available_for_rental();

-- ========================================
-- CORREÇÃO: Atualizar dados existentes
-- ========================================

-- Marcar como disponível todos os equipamentos no Depósito Malta
UPDATE assets 
SET available_for_rental = true 
WHERE location_type = 'deposito_malta' 
  AND (available_for_rental = false OR available_for_rental IS NULL)
  AND deleted_at IS NULL;

-- Marcar como indisponível todos os equipamentos fora do Depósito Malta
UPDATE assets 
SET available_for_rental = false 
WHERE location_type != 'deposito_malta' 
  AND available_for_rental = true
  AND deleted_at IS NULL;