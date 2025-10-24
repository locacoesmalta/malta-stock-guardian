-- Criar bucket para armazenar PDFs de recibos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf']
);

-- Políticas RLS para o bucket receipts
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Public can view receipts"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'receipts');