
-- =====================================================
-- MÓDULO DE PRECIFICAÇÃO E ANÁLISE DE VIABILIDADE
-- =====================================================

-- 1. TABELA: pricing_tax_config (Configurações Fiscais)
CREATE TABLE IF NOT EXISTS public.pricing_tax_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_type TEXT NOT NULL CHECK (location_type IN ('belem', 'interior_para', 'outros_estados')),
  iss_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  pis_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  cofins_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  csll_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  irpj_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(location_type)
);

-- 2. TABELA: pricing_asset_costs (Custos Operacionais por Equipamento)
CREATE TABLE IF NOT EXISTS public.pricing_asset_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code TEXT NOT NULL,
  depreciation_months INTEGER NOT NULL DEFAULT 60,
  monthly_maintenance_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  operational_cost_per_hour DECIMAL(12,2) NOT NULL DEFAULT 0,
  transport_cost_per_km DECIMAL(12,2) NOT NULL DEFAULT 0,
  employee_cost_per_day DECIMAL(12,2) NOT NULL DEFAULT 0,
  profit_margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 20,
  corrective_maintenance_margin DECIMAL(5,2) NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(asset_code)
);

-- 3. TABELA: pricing_calculations (Histórico de Cálculos)
CREATE TABLE IF NOT EXISTS public.pricing_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code TEXT NOT NULL,
  calculation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  location_type TEXT NOT NULL,
  distance_km DECIMAL(10,2) NOT NULL DEFAULT 0,
  rental_days INTEGER NOT NULL DEFAULT 1,
  profit_margin DECIMAL(12,2) NOT NULL DEFAULT 0,
  employee_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  depreciation_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  maintenance_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  transport_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  suggested_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ADICIONAR CAMPOS NA TABELA asset_maintenances
ALTER TABLE public.asset_maintenances 
  ADD COLUMN IF NOT EXISTS problem_description TEXT,
  ADD COLUMN IF NOT EXISTS is_recurring_problem BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_client_misuse BOOLEAN DEFAULT false;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_pricing_asset_costs_asset_code 
  ON public.pricing_asset_costs(asset_code);

CREATE INDEX IF NOT EXISTS idx_pricing_calculations_asset_code 
  ON public.pricing_calculations(asset_code);

CREATE INDEX IF NOT EXISTS idx_pricing_calculations_date 
  ON public.pricing_calculations(calculation_date DESC);

CREATE INDEX IF NOT EXISTS idx_pricing_calculations_created_by 
  ON public.pricing_calculations(created_by);

-- =====================================================
-- TRIGGERS PARA updated_at AUTOMÁTICO
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_pricing_tax_config_updated_at ON public.pricing_tax_config;
CREATE TRIGGER update_pricing_tax_config_updated_at
  BEFORE UPDATE ON public.pricing_tax_config
  FOR EACH ROW EXECUTE FUNCTION public.update_pricing_updated_at();

DROP TRIGGER IF EXISTS update_pricing_asset_costs_updated_at ON public.pricing_asset_costs;
CREATE TRIGGER update_pricing_asset_costs_updated_at
  BEFORE UPDATE ON public.pricing_asset_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_pricing_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- pricing_tax_config
ALTER TABLE public.pricing_tax_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tax config"
  ON public.pricing_tax_config FOR SELECT
  USING (is_user_active(auth.uid()));

CREATE POLICY "Admins can insert tax config"
  ON public.pricing_tax_config FOR INSERT
  WITH CHECK (is_admin_or_superuser(auth.uid()));

CREATE POLICY "Admins can update tax config"
  ON public.pricing_tax_config FOR UPDATE
  USING (is_admin_or_superuser(auth.uid()))
  WITH CHECK (is_admin_or_superuser(auth.uid()));

CREATE POLICY "Admins can delete tax config"
  ON public.pricing_tax_config FOR DELETE
  USING (is_admin_or_superuser(auth.uid()));

-- pricing_asset_costs
ALTER TABLE public.pricing_asset_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with asset access can view costs"
  ON public.pricing_asset_costs FOR SELECT
  USING (can_user_access_assets(auth.uid()));

CREATE POLICY "Admins can insert asset costs"
  ON public.pricing_asset_costs FOR INSERT
  WITH CHECK (is_admin_or_superuser(auth.uid()));

CREATE POLICY "Admins can update asset costs"
  ON public.pricing_asset_costs FOR UPDATE
  USING (is_admin_or_superuser(auth.uid()))
  WITH CHECK (is_admin_or_superuser(auth.uid()));

CREATE POLICY "Admins can delete asset costs"
  ON public.pricing_asset_costs FOR DELETE
  USING (is_admin_or_superuser(auth.uid()));

-- pricing_calculations
ALTER TABLE public.pricing_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calculations"
  ON public.pricing_calculations FOR SELECT
  USING (
    created_by = auth.uid() OR 
    is_admin_or_superuser(auth.uid())
  );

CREATE POLICY "Active users can create calculations"
  ON public.pricing_calculations FOR INSERT
  WITH CHECK (
    is_user_active(auth.uid()) AND 
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete own calculations"
  ON public.pricing_calculations FOR DELETE
  USING (
    created_by = auth.uid() OR 
    is_admin_or_superuser(auth.uid())
  );

-- =====================================================
-- DADOS INICIAIS - CONFIGURAÇÕES FISCAIS
-- =====================================================
INSERT INTO public.pricing_tax_config (location_type, iss_rate, pis_rate, cofins_rate, csll_rate, irpj_rate, is_active)
VALUES 
  ('belem', 0.0500, 0.0065, 0.0300, 0.0900, 0.1500, true),
  ('interior_para', 0.0300, 0.0065, 0.0300, 0.0900, 0.1500, true),
  ('outros_estados', 0.0500, 0.0065, 0.0300, 0.0900, 0.1500, true)
ON CONFLICT (location_type) DO NOTHING;
