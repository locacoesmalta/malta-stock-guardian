-- ============================================
-- FASE 3: VALIDAÇÕES E ROBUSTEZ SQL
-- ============================================

-- 1. CONSTRAINTS DE DATAS
-- ============================================

-- Garantir que rental_end_date > rental_start_date
ALTER TABLE assets
  DROP CONSTRAINT IF EXISTS check_rental_dates;
  
ALTER TABLE assets
  ADD CONSTRAINT check_rental_dates 
  CHECK (rental_end_date IS NULL OR rental_end_date > rental_start_date);

-- Garantir que maintenance_departure_date >= maintenance_arrival_date
ALTER TABLE assets
  DROP CONSTRAINT IF EXISTS check_maintenance_dates;
  
ALTER TABLE assets
  ADD CONSTRAINT check_maintenance_dates 
  CHECK (maintenance_departure_date IS NULL OR maintenance_departure_date >= maintenance_arrival_date);

-- Garantir que contract_end_date > contract_start_date
ALTER TABLE rental_companies
  DROP CONSTRAINT IF EXISTS check_contract_dates;
  
ALTER TABLE rental_companies
  ADD CONSTRAINT check_contract_dates 
  CHECK (contract_end_date > contract_start_date);

-- 2. CONSTRAINT DE HORÍMETRO
-- ============================================

-- Garantir que current_hourmeter >= previous_hourmeter
ALTER TABLE asset_maintenances
  DROP CONSTRAINT IF EXISTS check_hourmeter_progression;
  
ALTER TABLE asset_maintenances
  ADD CONSTRAINT check_hourmeter_progression
  CHECK (current_hourmeter >= previous_hourmeter);

-- 3. VALIDAÇÃO DE QUANTITY_USED (Trigger)
-- ============================================

-- Função para validar que quantity_used não excede quantity original
CREATE OR REPLACE FUNCTION validate_report_parts_quantity()
RETURNS TRIGGER AS $$
DECLARE
  withdrawal_qty INTEGER;
  total_used INTEGER;
BEGIN
  -- Buscar quantidade original da retirada
  SELECT quantity INTO withdrawal_qty
  FROM material_withdrawals
  WHERE id = NEW.withdrawal_id;
  
  IF withdrawal_qty IS NULL THEN
    RAISE EXCEPTION 'Retirada de material não encontrada (ID: %)', NEW.withdrawal_id;
  END IF;
  
  -- Somar total já usado (incluindo este novo/atualizado registro)
  SELECT COALESCE(SUM(quantity_used), 0) INTO total_used
  FROM report_parts
  WHERE withdrawal_id = NEW.withdrawal_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Adicionar a quantidade deste registro
  total_used := total_used + NEW.quantity_used;
  
  -- Validar se não excede
  IF total_used > withdrawal_qty THEN
    RAISE EXCEPTION 'Quantidade total usada (%) excede quantidade retirada (%) para withdrawal_id: %', 
      total_used, withdrawal_qty, NEW.withdrawal_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_validate_report_parts ON report_parts;

CREATE TRIGGER trigger_validate_report_parts
  BEFORE INSERT OR UPDATE ON report_parts
  FOR EACH ROW
  EXECUTE FUNCTION validate_report_parts_quantity();

-- 4. WARNING PARA DATAS RETROATIVAS ANTIGAS
-- ============================================

-- Função para avisar sobre datas muito antigas (> 90 dias)
CREATE OR REPLACE FUNCTION check_retroactive_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.withdrawal_date < CURRENT_DATE - INTERVAL '90 days' THEN
    RAISE WARNING 'Atenção: Retirada com data retroativa de % dias (Data: %)', 
      CURRENT_DATE - NEW.withdrawal_date, NEW.withdrawal_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_retroactive_withdrawal_warning ON material_withdrawals;

CREATE TRIGGER trigger_retroactive_withdrawal_warning
  BEFORE INSERT OR UPDATE ON material_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION check_retroactive_withdrawal();

-- 5. FUNÇÃO TRANSACIONAL PARA CRIAR RELATÓRIOS
-- ============================================

-- Função que cria relatório e peças em uma única transação
CREATE OR REPLACE FUNCTION create_report_with_parts(
  p_equipment_code TEXT,
  p_equipment_name TEXT,
  p_work_site TEXT,
  p_company TEXT,
  p_technician_name TEXT,
  p_report_date DATE,
  p_service_comments TEXT,
  p_considerations TEXT DEFAULT NULL,
  p_observations TEXT DEFAULT NULL,
  p_receiver TEXT DEFAULT NULL,
  p_responsible TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_parts JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_report_id UUID;
  v_part JSONB;
BEGIN
  -- Validar usuário
  IF p_created_by IS NULL THEN
    p_created_by := auth.uid();
  END IF;
  
  IF p_created_by IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Inserir relatório
  INSERT INTO reports (
    equipment_code,
    equipment_name,
    work_site,
    company,
    technician_name,
    report_date,
    service_comments,
    considerations,
    observations,
    receiver,
    responsible,
    created_by
  ) VALUES (
    p_equipment_code,
    p_equipment_name,
    p_work_site,
    p_company,
    p_technician_name,
    p_report_date,
    p_service_comments,
    p_considerations,
    p_observations,
    p_receiver,
    p_responsible,
    p_created_by
  ) RETURNING id INTO v_report_id;
  
  -- Inserir peças (se houver)
  IF jsonb_array_length(p_parts) > 0 THEN
    FOR v_part IN SELECT * FROM jsonb_array_elements(p_parts)
    LOOP
      INSERT INTO report_parts (
        report_id,
        product_id,
        quantity_used,
        withdrawal_id
      ) VALUES (
        v_report_id,
        (v_part->>'product_id')::UUID,
        (v_part->>'quantity_used')::INTEGER,
        (v_part->>'withdrawal_id')::UUID
      );
    END LOOP;
  END IF;
  
  -- Retornar ID do relatório criado
  RETURN v_report_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, o PostgreSQL fará rollback automático
    RAISE EXCEPTION 'Erro ao criar relatório: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;