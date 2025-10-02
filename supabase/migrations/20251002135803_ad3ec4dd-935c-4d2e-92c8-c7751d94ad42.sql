-- Adicionar campos para controle de tempo de manutenção
ALTER TABLE public.assets
ADD COLUMN maintenance_arrival_date date,
ADD COLUMN maintenance_departure_date date,
ADD COLUMN maintenance_delay_observations text;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.assets.maintenance_arrival_date IS 'Data de chegada do equipamento para manutenção (obrigatório quando em manutenção)';
COMMENT ON COLUMN public.assets.maintenance_departure_date IS 'Data de saída do equipamento da manutenção (opcional)';
COMMENT ON COLUMN public.assets.maintenance_delay_observations IS 'Observações sobre atrasos no tempo de manutenção';