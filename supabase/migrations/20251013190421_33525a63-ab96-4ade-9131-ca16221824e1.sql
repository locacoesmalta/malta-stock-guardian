-- 1. Adicionar coluna invoice_date na tabela cash_box_transactions
ALTER TABLE cash_box_transactions 
ADD COLUMN invoice_date DATE;

-- 2. Tornar o bucket público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cash-box-attachments';

-- 3. Criar política RLS para permitir leitura pública dos anexos
CREATE POLICY "Public read access to cash box attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cash-box-attachments');

-- 4. Política de upload para usuários autenticados (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Authenticated users can upload cash box attachments'
  ) THEN
    CREATE POLICY "Authenticated users can upload cash box attachments"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'cash-box-attachments');
  END IF;
END $$;