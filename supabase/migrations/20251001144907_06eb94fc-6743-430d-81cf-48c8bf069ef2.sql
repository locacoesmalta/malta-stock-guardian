-- Add manufacturer field to products table
ALTER TABLE public.products 
ADD COLUMN manufacturer text;

-- Add comment to describe the new field
COMMENT ON COLUMN public.products.manufacturer IS 'Product manufacturer or brand name';