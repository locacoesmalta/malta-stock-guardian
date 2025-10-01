-- Remove a foreign key constraint existente e adiciona com CASCADE
ALTER TABLE public.material_withdrawals
DROP CONSTRAINT IF EXISTS material_withdrawals_product_id_fkey;

-- Adiciona a foreign key com ON DELETE CASCADE
ALTER TABLE public.material_withdrawals
ADD CONSTRAINT material_withdrawals_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES public.products(id) 
ON DELETE CASCADE;