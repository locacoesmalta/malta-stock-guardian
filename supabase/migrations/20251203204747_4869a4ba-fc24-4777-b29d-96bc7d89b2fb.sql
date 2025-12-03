-- Criar bucket para fotos de planos de manutenção
INSERT INTO storage.buckets (id, name, public)
VALUES ('maintenance-photos', 'maintenance-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Política de upload para usuários autenticados
CREATE POLICY "Authenticated users can upload maintenance photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'maintenance-photos');

-- Política de leitura pública
CREATE POLICY "Anyone can view maintenance photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'maintenance-photos');

-- Política de update para usuários autenticados
CREATE POLICY "Authenticated users can update maintenance photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'maintenance-photos');

-- Política de delete para usuários autenticados
CREATE POLICY "Authenticated users can delete maintenance photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'maintenance-photos');