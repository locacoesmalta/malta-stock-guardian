-- Add comments field to products table
ALTER TABLE public.products 
ADD COLUMN comments text;

-- Add comment to describe the new field
COMMENT ON COLUMN public.products.comments IS 'Additional comments or specifications about the product';