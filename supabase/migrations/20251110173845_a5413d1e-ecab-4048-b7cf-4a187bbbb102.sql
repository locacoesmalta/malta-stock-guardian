-- Fase 4: Triggers para normalização automática no backend
-- Garante que TODOS os campos de texto sejam convertidos para MAIÚSCULAS antes de salvar

CREATE OR REPLACE FUNCTION auto_normalize_text_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- ASSETS: Normalizar todos os campos de texto
  IF TG_TABLE_NAME = 'assets' THEN
    -- Campos obrigatórios
    NEW.asset_code := UPPER(TRIM(COALESCE(NEW.asset_code, '')));
    NEW.equipment_name := UPPER(TRIM(COALESCE(NEW.equipment_name, '')));
    NEW.manufacturer := UPPER(TRIM(COALESCE(NEW.manufacturer, '')));
    NEW.location_type := UPPER(TRIM(COALESCE(NEW.location_type, '')));
    
    -- Campos opcionais
    IF NEW.model IS NOT NULL THEN
      NEW.model := UPPER(TRIM(NEW.model));
    END IF;
    
    IF NEW.serial_number IS NOT NULL THEN
      NEW.serial_number := UPPER(TRIM(NEW.serial_number));
    END IF;
    
    IF NEW.voltage_combustion IS NOT NULL THEN
      NEW.voltage_combustion := UPPER(TRIM(NEW.voltage_combustion));
    END IF;
    
    IF NEW.supplier IS NOT NULL THEN
      NEW.supplier := UPPER(TRIM(NEW.supplier));
    END IF;
    
    IF NEW.rental_company IS NOT NULL THEN
      NEW.rental_company := UPPER(TRIM(NEW.rental_company));
    END IF;
    
    IF NEW.rental_work_site IS NOT NULL THEN
      NEW.rental_work_site := UPPER(TRIM(NEW.rental_work_site));
    END IF;
    
    IF NEW.deposito_description IS NOT NULL THEN
      NEW.deposito_description := UPPER(TRIM(NEW.deposito_description));
    END IF;
    
    IF NEW.maintenance_company IS NOT NULL THEN
      NEW.maintenance_company := UPPER(TRIM(NEW.maintenance_company));
    END IF;
    
    IF NEW.maintenance_work_site IS NOT NULL THEN
      NEW.maintenance_work_site := UPPER(TRIM(NEW.maintenance_work_site));
    END IF;
    
    IF NEW.rental_contract_number IS NOT NULL THEN
      NEW.rental_contract_number := UPPER(TRIM(NEW.rental_contract_number));
    END IF;
    
    IF NEW.malta_collaborator IS NOT NULL THEN
      NEW.malta_collaborator := UPPER(TRIM(NEW.malta_collaborator));
    END IF;
  END IF;
  
  -- PRODUCTS: Normalizar todos os campos de texto
  IF TG_TABLE_NAME = 'products' THEN
    -- Campos obrigatórios
    NEW.code := UPPER(TRIM(COALESCE(NEW.code, '')));
    NEW.name := UPPER(TRIM(COALESCE(NEW.name, '')));
    
    -- Campos opcionais
    IF NEW.manufacturer IS NOT NULL THEN
      NEW.manufacturer := UPPER(TRIM(NEW.manufacturer));
    END IF;
    
    IF NEW.equipment_brand IS NOT NULL THEN
      NEW.equipment_brand := UPPER(TRIM(NEW.equipment_brand));
    END IF;
    
    IF NEW.equipment_type IS NOT NULL THEN
      NEW.equipment_type := UPPER(TRIM(NEW.equipment_type));
    END IF;
    
    IF NEW.equipment_model IS NOT NULL THEN
      NEW.equipment_model := UPPER(TRIM(NEW.equipment_model));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover triggers existentes se houver
DROP TRIGGER IF EXISTS normalize_assets_before_write ON public.assets;
DROP TRIGGER IF EXISTS normalize_products_before_write ON public.products;

-- Aplicar trigger em ASSETS
CREATE TRIGGER normalize_assets_before_write
  BEFORE INSERT OR UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION auto_normalize_text_fields();

-- Aplicar trigger em PRODUCTS
CREATE TRIGGER normalize_products_before_write
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION auto_normalize_text_fields();

-- Comentários para documentação
COMMENT ON FUNCTION auto_normalize_text_fields() IS 'Normaliza automaticamente todos os campos de texto para MAIÚSCULAS antes de salvar no banco de dados. Garante consistência e previne duplicatas por diferença de capitalização.';
COMMENT ON TRIGGER normalize_assets_before_write ON public.assets IS 'Trigger que normaliza campos de texto em ASSETS antes de INSERT ou UPDATE';
COMMENT ON TRIGGER normalize_products_before_write ON public.products IS 'Trigger que normaliza campos de texto em PRODUCTS antes de INSERT ou UPDATE';