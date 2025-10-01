-- Adicionar campo de observações gerais sobre o equipamento
ALTER TABLE public.assets 
ADD COLUMN equipment_observations TEXT;