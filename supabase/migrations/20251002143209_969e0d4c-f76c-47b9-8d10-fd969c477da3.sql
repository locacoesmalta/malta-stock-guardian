-- Adicionar campo para armazenar o destino após manutenção quando não volta para obra
ALTER TABLE public.assets
ADD COLUMN destination_after_maintenance text;

COMMENT ON COLUMN public.assets.destination_after_maintenance IS 'Destino do equipamento após manutenção quando não volta para obra: deposito_malta, locacao, aguardando_laudo, troca_equipamento';