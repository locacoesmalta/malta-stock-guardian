-- Adicionar novos campos ao relatório
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS considerations TEXT,
ADD COLUMN IF NOT EXISTS observations TEXT,
ADD COLUMN IF NOT EXISTS receiver TEXT,
ADD COLUMN IF NOT EXISTS responsible TEXT;