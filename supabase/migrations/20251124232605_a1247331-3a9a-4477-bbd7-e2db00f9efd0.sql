-- Criar tabela de catálogo de equipamentos para locação
CREATE TABLE IF NOT EXISTS public.equipment_rental_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  unit TEXT DEFAULT 'UN',
  price_15_days NUMERIC,
  price_30_days NUMERIC,
  daily_rate_15 NUMERIC,
  daily_rate_30 NUMERIC,
  special_rules TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índice para busca por nome
CREATE INDEX IF NOT EXISTS idx_rental_catalog_name ON public.equipment_rental_catalog(name);
CREATE INDEX IF NOT EXISTS idx_rental_catalog_active ON public.equipment_rental_catalog(is_active);

-- Popular catálogo inicial com equipamentos existentes
INSERT INTO public.equipment_rental_catalog (name)
SELECT DISTINCT equipment_name 
FROM public.assets 
WHERE deleted_at IS NULL
ON CONFLICT (name) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.equipment_rental_catalog ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem visualizar catálogo ativo
CREATE POLICY "Todos podem visualizar catálogo de equipamentos"
  ON public.equipment_rental_catalog
  FOR SELECT
  USING (true);

-- Policy: Apenas admins/superusers podem inserir
CREATE POLICY "Admins podem inserir equipamentos no catálogo"
  ON public.equipment_rental_catalog
  FOR INSERT
  WITH CHECK (is_admin_or_superuser(auth.uid()));

-- Policy: Apenas admins/superusers podem atualizar
CREATE POLICY "Admins podem atualizar catálogo de equipamentos"
  ON public.equipment_rental_catalog
  FOR UPDATE
  USING (is_admin_or_superuser(auth.uid()))
  WITH CHECK (is_admin_or_superuser(auth.uid()));

-- Policy: Apenas admins/superusers podem deletar
CREATE POLICY "Admins podem deletar equipamentos do catálogo"
  ON public.equipment_rental_catalog
  FOR DELETE
  USING (is_admin_or_superuser(auth.uid()));

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_rental_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rental_catalog_updated_at_trigger
  BEFORE UPDATE ON public.equipment_rental_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rental_catalog_updated_at();