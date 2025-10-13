-- Adicionar campo work_site na tabela rental_equipment para permitir que cada equipamento vá para uma obra diferente
ALTER TABLE public.rental_equipment
ADD COLUMN work_site TEXT;