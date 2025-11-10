-- Corrigir função de normalização para não afetar location_type
CREATE OR REPLACE FUNCTION public.auto_normalize_text_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- ASSETS: Normalizar todos os campos de texto EXCETO location_type
  IF TG_TABLE_NAME = 'assets' THEN
    -- Campos obrigatórios
    NEW.asset_code := UPPER(TRIM(COALESCE(NEW.asset_code, '')));
    NEW.equipment_name := UPPER(TRIM(COALESCE(NEW.equipment_name, '')));
    NEW.manufacturer := UPPER(TRIM(COALESCE(NEW.manufacturer, '')));
    
    -- NÃO normalizar location_type (deixar como está)
    -- location_type já é validado pelo check constraint
    
    -- Campos opcionais
    IF NEW.model IS NOT NULL THEN
      NEW.model := UPPER(TRIM(NEW.model));
    END IF;
    
    IF NEW.deposito_description IS NOT NULL THEN
      NEW.deposito_description := UPPER(TRIM(NEW.deposito_description));
    END IF;
    
    IF NEW.rental_company IS NOT NULL THEN
      NEW.rental_company := UPPER(TRIM(NEW.rental_company));
    END IF;
    
    IF NEW.rental_work_site IS NOT NULL THEN
      NEW.rental_work_site := UPPER(TRIM(NEW.rental_work_site));
    END IF;
    
    IF NEW.maintenance_company IS NOT NULL THEN
      NEW.maintenance_company := UPPER(TRIM(NEW.maintenance_company));
    END IF;
    
    IF NEW.maintenance_work_site IS NOT NULL THEN
      NEW.maintenance_work_site := UPPER(TRIM(NEW.maintenance_work_site));
    END IF;
    
    IF NEW.malta_collaborator IS NOT NULL THEN
      NEW.malta_collaborator := UPPER(TRIM(NEW.malta_collaborator));
    END IF;
  END IF;

  -- PRODUCTS: Normalizar campos
  IF TG_TABLE_NAME = 'products' THEN
    NEW.code := UPPER(TRIM(COALESCE(NEW.code, '')));
    NEW.name := UPPER(TRIM(COALESCE(NEW.name, '')));
    
    IF NEW.manufacturer IS NOT NULL THEN
      NEW.manufacturer := UPPER(TRIM(NEW.manufacturer));
    END IF;
    
    IF NEW.equipment_type IS NOT NULL THEN
      NEW.equipment_type := UPPER(TRIM(NEW.equipment_type));
    END IF;
    
    IF NEW.equipment_brand IS NOT NULL THEN
      NEW.equipment_brand := UPPER(TRIM(NEW.equipment_brand));
    END IF;
    
    IF NEW.equipment_model IS NOT NULL THEN
      NEW.equipment_model := UPPER(TRIM(NEW.equipment_model));
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;