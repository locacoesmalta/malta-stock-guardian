-- =====================================================
-- PHASE 1: FOUNDATION SECURE - Database Optimizations
-- =====================================================

-- 1. PERFORMANCE INDEXES
-- Índices para queries mais frequentes baseado nas consultas existentes

-- Assets table indexes
CREATE INDEX IF NOT EXISTS idx_assets_location_type ON public.assets(location_type);
CREATE INDEX IF NOT EXISTS idx_assets_asset_code ON public.assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_assets_rental_company ON public.assets(rental_company) WHERE rental_company IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_maintenance_status ON public.assets(maintenance_status);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at DESC);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON public.products(quantity) WHERE quantity <= min_quantity;
CREATE INDEX IF NOT EXISTS idx_products_equipment_brand ON public.products(equipment_brand) WHERE equipment_brand IS NOT NULL;

-- Material withdrawals indexes
CREATE INDEX IF NOT EXISTS idx_withdrawals_date ON public.material_withdrawals(withdrawal_date DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_equipment_code ON public.material_withdrawals(equipment_code);
CREATE INDEX IF NOT EXISTS idx_withdrawals_company ON public.material_withdrawals(company);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_date ON public.reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_equipment_code ON public.reports(equipment_code);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON public.reports(created_by);

-- Equipment receipts indexes
CREATE INDEX IF NOT EXISTS idx_receipts_date ON public.equipment_receipts(receipt_date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_type ON public.equipment_receipts(receipt_type);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON public.equipment_receipts(receipt_number);

-- Audit logs indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);

-- 2. SOFT DELETE IMPLEMENTATION
-- Adicionar coluna deleted_at para soft delete (mantém histórico)

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.equipment_receipts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Índices para soft delete
CREATE INDEX IF NOT EXISTS idx_assets_deleted_at ON public.assets(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reports_deleted_at ON public.reports(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_deleted_at ON public.equipment_receipts(deleted_at) WHERE deleted_at IS NULL;

-- 3. UNIQUE CONSTRAINTS
-- Garantir integridade de dados únicos

-- Asset code deve ser único (não deletados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_code_unique 
ON public.assets(asset_code) 
WHERE deleted_at IS NULL;

-- Product code deve ser único (não deletados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code_unique 
ON public.products(code) 
WHERE deleted_at IS NULL;

-- Receipt number deve ser único por tipo
CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_number_type_unique 
ON public.equipment_receipts(receipt_number, receipt_type) 
WHERE deleted_at IS NULL;

-- 4. RLS POLICY CORRECTIONS
-- Corrigir política faltante em equipment_receipt_items

DROP POLICY IF EXISTS "Users can update receipt items if they can edit receipts" ON public.equipment_receipt_items;

CREATE POLICY "Users can update receipt items if they can edit receipts"
ON public.equipment_receipt_items
FOR UPDATE
TO authenticated
USING (
  can_user_edit_reports(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.equipment_receipts
    WHERE id = equipment_receipt_items.receipt_id
  )
)
WITH CHECK (
  can_user_edit_reports(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.equipment_receipts
    WHERE id = equipment_receipt_items.receipt_id
  )
);

-- 5. BUSINESS VALIDATION TRIGGERS
-- Validações de regras de negócio no banco

-- Função para validar datas de manutenção
CREATE OR REPLACE FUNCTION public.validate_maintenance_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar que data de saída é posterior à data de entrada
  IF NEW.maintenance_departure_date IS NOT NULL 
     AND NEW.maintenance_arrival_date IS NOT NULL 
     AND NEW.maintenance_departure_date < NEW.maintenance_arrival_date THEN
    RAISE EXCEPTION 'Data de saída da manutenção não pode ser anterior à data de entrada';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para validação de datas de manutenção
DROP TRIGGER IF EXISTS trigger_validate_maintenance_dates ON public.assets;
CREATE TRIGGER trigger_validate_maintenance_dates
  BEFORE INSERT OR UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_maintenance_dates();

-- Função para validar datas de locação
CREATE OR REPLACE FUNCTION public.validate_rental_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar que data final é posterior à data inicial
  IF NEW.rental_end_date IS NOT NULL 
     AND NEW.rental_start_date IS NOT NULL 
     AND NEW.rental_end_date < NEW.rental_start_date THEN
    RAISE EXCEPTION 'Data final de locação não pode ser anterior à data inicial';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para validação de datas de locação
DROP TRIGGER IF EXISTS trigger_validate_rental_dates ON public.assets;
CREATE TRIGGER trigger_validate_rental_dates
  BEFORE INSERT OR UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_rental_dates();

-- Função para validar estoque negativo
CREATE OR REPLACE FUNCTION public.validate_stock_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar que quantidade não fica negativa
  IF NEW.quantity < 0 THEN
    RAISE EXCEPTION 'Quantidade em estoque não pode ser negativa. Produto: %, Tentativa: %', 
      (SELECT name FROM public.products WHERE id = NEW.id), NEW.quantity;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para validação de estoque
DROP TRIGGER IF EXISTS trigger_validate_stock_quantity ON public.products;
CREATE TRIGGER trigger_validate_stock_quantity
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  WHEN (NEW.quantity IS DISTINCT FROM OLD.quantity)
  EXECUTE FUNCTION public.validate_stock_quantity();

-- 6. AUDIT IMPROVEMENT
-- Melhorar auditoria para incluir soft deletes

CREATE OR REPLACE FUNCTION public.log_soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_user_name text;
  v_log_hash text;
BEGIN
  -- Apenas registrar quando deleted_at muda de NULL para uma data
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    SELECT email, full_name INTO v_user_email, v_user_name
    FROM public.profiles
    WHERE id = auth.uid();
    
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'SOFT_DELETE', TG_TABLE_NAME, NEW.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id,
      old_data, new_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(),
      COALESCE(v_user_email, 'unknown'),
      v_user_name,
      'SOFT_DELETE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      'log_soft_delete',
      v_log_hash
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Triggers de soft delete para auditoria
DROP TRIGGER IF EXISTS trigger_log_assets_soft_delete ON public.assets;
CREATE TRIGGER trigger_log_assets_soft_delete
  AFTER UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_soft_delete();

DROP TRIGGER IF EXISTS trigger_log_products_soft_delete ON public.products;
CREATE TRIGGER trigger_log_products_soft_delete
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.log_soft_delete();

DROP TRIGGER IF EXISTS trigger_log_reports_soft_delete ON public.reports;
CREATE TRIGGER trigger_log_reports_soft_delete
  AFTER UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.log_soft_delete();

-- 7. ATUALIZAR RLS POLICIES PARA CONSIDERAR SOFT DELETE
-- Atualizar políticas existentes para excluir registros deletados

-- Assets policies
DROP POLICY IF EXISTS "Users with permission can view assets" ON public.assets;
CREATE POLICY "Users with permission can view assets"
ON public.assets
FOR SELECT
TO authenticated
USING (can_user_access_assets(auth.uid()) AND deleted_at IS NULL);

-- Products policies  
DROP POLICY IF EXISTS "Authenticated users with permission can view products" ON public.products;
CREATE POLICY "Authenticated users with permission can view products"
ON public.products
FOR SELECT
TO authenticated
USING (can_user_view_products(auth.uid()) AND deleted_at IS NULL);

-- Reports policies
DROP POLICY IF EXISTS "Authenticated users with permission can view reports" ON public.reports;
CREATE POLICY "Authenticated users with permission can view reports"
ON public.reports
FOR SELECT
TO authenticated
USING (can_user_view_reports(auth.uid()) AND deleted_at IS NULL);

-- Equipment receipts policies
DROP POLICY IF EXISTS "Users with permission can view receipts" ON public.equipment_receipts;
CREATE POLICY "Users with permission can view receipts"
ON public.equipment_receipts
FOR SELECT
TO authenticated
USING (can_user_view_reports(auth.uid()) AND deleted_at IS NULL);

COMMENT ON COLUMN public.assets.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN public.products.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN public.reports.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN public.equipment_receipts.deleted_at IS 'Soft delete timestamp - NULL means active';