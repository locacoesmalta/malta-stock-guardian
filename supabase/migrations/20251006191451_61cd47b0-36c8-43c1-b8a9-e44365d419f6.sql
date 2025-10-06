-- Permitir NULL em campo_alterado, valor_antigo e valor_novo
-- pois nem todos os eventos alteram um campo específico
ALTER TABLE public.patrimonio_historico 
ALTER COLUMN campo_alterado DROP NOT NULL;

COMMENT ON COLUMN public.patrimonio_historico.campo_alterado IS 'Campo que foi alterado (opcional para eventos que não alteram campos específicos)';