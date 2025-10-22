-- Criar bucket de storage para fotos de comprovantes
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipt-photos', 'receipt-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket de fotos de comprovantes
CREATE POLICY "Usuários autenticados podem fazer upload de fotos de comprovantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipt-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Fotos de comprovantes são publicamente acessíveis"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipt-photos');

CREATE POLICY "Usuários com permissão podem deletar fotos de comprovantes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'receipt-photos' AND can_user_delete_reports(auth.uid()));

-- Adicionar coluna para armazenar URLs das fotos nos itens do comprovante
ALTER TABLE equipment_receipt_items
ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]'::jsonb;