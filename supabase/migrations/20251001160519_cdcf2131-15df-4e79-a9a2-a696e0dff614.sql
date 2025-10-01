-- Remove a foreign key constraint da tabela report_parts e adiciona com CASCADE
ALTER TABLE public.report_parts
DROP CONSTRAINT IF EXISTS report_parts_product_id_fkey;

-- Adiciona a foreign key com ON DELETE CASCADE
ALTER TABLE public.report_parts
ADD CONSTRAINT report_parts_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES public.products(id) 
ON DELETE CASCADE;