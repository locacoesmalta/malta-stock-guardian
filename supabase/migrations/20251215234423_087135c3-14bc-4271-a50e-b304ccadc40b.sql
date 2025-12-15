-- Fase 1: Alterações no Banco de Dados

-- 1.1 Tabela rental_companies - Adicionar dia de corte
ALTER TABLE rental_companies 
  ADD COLUMN IF NOT EXISTS dia_corte INTEGER DEFAULT 1;

-- 1.2 Tabela rental_equipment - Duas diárias + período
ALTER TABLE rental_equipment 
  ADD COLUMN IF NOT EXISTS daily_rate_15 NUMERIC,
  ADD COLUMN IF NOT EXISTS daily_rate_30 NUMERIC,
  ADD COLUMN IF NOT EXISTS rental_period TEXT DEFAULT '30';

-- Migrar dados existentes (daily_rate → daily_rate_30)
UPDATE rental_equipment 
  SET daily_rate_30 = daily_rate 
  WHERE daily_rate IS NOT NULL AND daily_rate_30 IS NULL;

-- 1.3 Tabela rental_measurements - Adicionar número sequencial e data de corte
ALTER TABLE rental_measurements 
  ADD COLUMN IF NOT EXISTS cut_date DATE;

-- Comentários para documentação
COMMENT ON COLUMN rental_companies.dia_corte IS 'Dia do mês para fechar medição (1-31)';
COMMENT ON COLUMN rental_equipment.daily_rate_15 IS 'Valor da diária para período de 15 dias (maior)';
COMMENT ON COLUMN rental_equipment.daily_rate_30 IS 'Valor da diária para período de 30/31 dias (menor)';
COMMENT ON COLUMN rental_equipment.rental_period IS 'Período de locação: 15, 30 ou 31 dias';
COMMENT ON COLUMN rental_measurements.cut_date IS 'Data de corte da medição';