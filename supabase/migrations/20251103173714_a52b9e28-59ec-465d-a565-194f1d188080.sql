-- Adicionar campos para previsão de manutenção na tabela assets
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS next_maintenance_hourmeter INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS maintenance_interval INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS maintenance_status TEXT DEFAULT 'sem_dados';

-- Adicionar constraint para maintenance_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'assets_maintenance_status_check'
  ) THEN
    ALTER TABLE assets
      ADD CONSTRAINT assets_maintenance_status_check 
      CHECK (maintenance_status IN ('em_dia', 'proxima_manutencao', 'atrasada', 'sem_dados'));
  END IF;
END $$;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_assets_maintenance_status ON assets(maintenance_status);
CREATE INDEX IF NOT EXISTS idx_assets_next_maintenance ON assets(next_maintenance_hourmeter);

-- Função para calcular próxima manutenção automaticamente
CREATE OR REPLACE FUNCTION calculate_next_maintenance()
RETURNS TRIGGER AS $$
DECLARE
  v_current_total INTEGER;
  v_interval INTEGER;
BEGIN
  -- Buscar horímetro total atual do ativo
  SELECT COALESCE(SUM(total_hourmeter), 0) INTO v_current_total
  FROM asset_maintenances
  WHERE asset_id = NEW.asset_id;
  
  -- Determinar intervalo baseado no total de horas (em segundos)
  -- 200h = 720000s, 800h = 2880000s, 2000h = 7200000s
  IF v_current_total < 720000 THEN
    v_interval := 720000; -- Próxima em 200h
  ELSIF v_current_total < 2880000 THEN
    v_interval := 2880000 - v_current_total; -- Completar até 800h
  ELSE
    v_interval := 7200000; -- Próxima em 2000h a partir do atual
  END IF;
  
  -- Atualizar o ativo com a previsão
  UPDATE assets
  SET 
    next_maintenance_hourmeter = v_current_total + v_interval,
    maintenance_interval = v_interval,
    maintenance_status = 'em_dia',
    updated_at = NOW()
  WHERE id = NEW.asset_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para executar após inserir manutenção
DROP TRIGGER IF EXISTS trigger_calculate_next_maintenance ON asset_maintenances;
CREATE TRIGGER trigger_calculate_next_maintenance
  AFTER INSERT ON asset_maintenances
  FOR EACH ROW
  EXECUTE FUNCTION calculate_next_maintenance();

-- Função para atualizar status baseado no horímetro atual
CREATE OR REPLACE FUNCTION update_maintenance_status()
RETURNS void AS $$
BEGIN
  UPDATE assets
  SET maintenance_status = CASE
    -- Sem dados de manutenção
    WHEN next_maintenance_hourmeter IS NULL THEN 'sem_dados'
    -- Manutenção atrasada (passou do horímetro previsto)
    WHEN (SELECT COALESCE(SUM(total_hourmeter), 0) FROM asset_maintenances WHERE asset_id = assets.id) 
         >= next_maintenance_hourmeter THEN 'atrasada'
    -- Próxima manutenção (80% do intervalo)
    WHEN (SELECT COALESCE(SUM(total_hourmeter), 0) FROM asset_maintenances WHERE asset_id = assets.id)
         >= (next_maintenance_hourmeter - (maintenance_interval * 0.2)) THEN 'proxima_manutencao'
    -- Em dia
    ELSE 'em_dia'
  END
  WHERE next_maintenance_hourmeter IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;