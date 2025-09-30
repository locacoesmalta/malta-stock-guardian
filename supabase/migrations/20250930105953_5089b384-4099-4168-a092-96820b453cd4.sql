-- Adicionar campos obrigatórios para retirada de material
ALTER TABLE public.material_withdrawals
ADD COLUMN equipment_code TEXT NOT NULL DEFAULT '',
ADD COLUMN work_site TEXT NOT NULL DEFAULT '',
ADD COLUMN company TEXT NOT NULL DEFAULT '';

-- Remover os valores padrão após adicionar as colunas
ALTER TABLE public.material_withdrawals
ALTER COLUMN equipment_code DROP DEFAULT,
ALTER COLUMN work_site DROP DEFAULT,
ALTER COLUMN company DROP DEFAULT;