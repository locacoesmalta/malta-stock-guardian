-- Tabela principal de manutenções
CREATE TABLE IF NOT EXISTS public.asset_maintenances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventiva', 'corretiva')),
  previous_hourmeter INTEGER NOT NULL DEFAULT 0, -- em segundos
  current_hourmeter INTEGER NOT NULL DEFAULT 0, -- em segundos
  total_hourmeter INTEGER GENERATED ALWAYS AS (current_hourmeter - previous_hourmeter) STORED,
  services_performed TEXT NOT NULL,
  observations TEXT,
  technician_name TEXT,
  labor_cost NUMERIC(10,2) DEFAULT 0,
  parts_cost NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2) GENERATED ALWAYS AS (COALESCE(labor_cost, 0) + COALESCE(parts_cost, 0)) STORED,
  registered_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela de peças utilizadas nas manutenções
CREATE TABLE IF NOT EXISTS public.asset_maintenance_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id UUID NOT NULL REFERENCES public.asset_maintenances(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_asset_maintenances_asset_id ON public.asset_maintenances(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenances_date ON public.asset_maintenances(maintenance_date DESC);
CREATE INDEX IF NOT EXISTS idx_asset_maintenances_type ON public.asset_maintenances(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_parts_maintenance_id ON public.asset_maintenance_parts(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_parts_product_id ON public.asset_maintenance_parts(product_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_asset_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_asset_maintenance_updated_at
  BEFORE UPDATE ON public.asset_maintenances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_asset_maintenance_updated_at();

-- Função para obter horímetro total acumulado
CREATE OR REPLACE FUNCTION public.get_total_hourmeter(p_asset_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(total_hourmeter), 0)::INTEGER
  FROM asset_maintenances
  WHERE asset_id = p_asset_id;
$$;

-- RLS Policies
ALTER TABLE public.asset_maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance_parts ENABLE ROW LEVEL SECURITY;

-- Políticas para asset_maintenances
CREATE POLICY "Users with permission can view maintenances"
  ON public.asset_maintenances
  FOR SELECT
  USING (can_user_access_assets(auth.uid()));

CREATE POLICY "Users with permission can insert maintenances"
  ON public.asset_maintenances
  FOR INSERT
  WITH CHECK (can_user_edit_assets(auth.uid()) AND registered_by = auth.uid());

CREATE POLICY "Users with permission can update maintenances"
  ON public.asset_maintenances
  FOR UPDATE
  USING (can_user_edit_assets(auth.uid()));

CREATE POLICY "Users with permission can delete maintenances"
  ON public.asset_maintenances
  FOR DELETE
  USING (can_user_delete_assets(auth.uid()));

-- Políticas para asset_maintenance_parts
CREATE POLICY "Users with permission can view maintenance parts"
  ON public.asset_maintenance_parts
  FOR SELECT
  USING (can_user_access_assets(auth.uid()));

CREATE POLICY "Users with permission can insert maintenance parts"
  ON public.asset_maintenance_parts
  FOR INSERT
  WITH CHECK (can_user_edit_assets(auth.uid()));

CREATE POLICY "Users with permission can delete maintenance parts"
  ON public.asset_maintenance_parts
  FOR DELETE
  USING (can_user_delete_assets(auth.uid()));

-- Trigger para registrar no histórico do patrimônio
CREATE OR REPLACE FUNCTION public.log_maintenance_to_history()
RETURNS TRIGGER AS $$
DECLARE
  v_asset_code TEXT;
  v_user_name TEXT;
  v_details TEXT;
BEGIN
  -- Buscar código do ativo
  SELECT asset_code INTO v_asset_code
  FROM public.assets
  WHERE id = NEW.asset_id;

  -- Buscar nome do usuário
  SELECT full_name INTO v_user_name
  FROM public.profiles
  WHERE id = NEW.registered_by;

  -- Montar detalhes
  v_details := format(
    'Serviços: %s. Horímetro: %s → %s (Total: %s). Técnico: %s. Custo Total: R$ %s',
    NEW.services_performed,
    (NEW.previous_hourmeter || ' seg'),
    (NEW.current_hourmeter || ' seg'),
    (NEW.total_hourmeter || ' seg'),
    COALESCE(NEW.technician_name, 'Não informado'),
    COALESCE(NEW.total_cost::TEXT, '0.00')
  );

  -- Registrar no histórico
  INSERT INTO public.patrimonio_historico (
    pat_id,
    codigo_pat,
    tipo_evento,
    detalhes_evento,
    usuario_modificacao,
    usuario_nome
  ) VALUES (
    NEW.asset_id,
    v_asset_code,
    CASE 
      WHEN NEW.maintenance_type = 'preventiva' THEN 'MANUTENÇÃO PREVENTIVA'
      ELSE 'MANUTENÇÃO CORRETIVA'
    END,
    v_details,
    NEW.registered_by,
    v_user_name
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_log_maintenance_to_history
  AFTER INSERT ON public.asset_maintenances
  FOR EACH ROW
  EXECUTE FUNCTION public.log_maintenance_to_history();