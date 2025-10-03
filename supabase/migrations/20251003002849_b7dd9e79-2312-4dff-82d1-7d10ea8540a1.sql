-- Adicionar novos campos à tabela assets para cadastro completo de equipamentos
ALTER TABLE public.assets
ADD COLUMN manufacturer TEXT NOT NULL DEFAULT 'A definir',
ADD COLUMN model TEXT,
ADD COLUMN serial_number TEXT,
ADD COLUMN voltage_combustion TEXT CHECK (voltage_combustion IN ('110V', '220V', 'GASOLINA', 'DIESEL', 'GÁS')),
ADD COLUMN supplier TEXT,
ADD COLUMN purchase_date DATE,
ADD COLUMN unit_value DECIMAL(10,2),
ADD COLUMN equipment_condition TEXT CHECK (equipment_condition IN ('NOVO', 'USADO')),
ADD COLUMN manual_attachment TEXT,
ADD COLUMN exploded_drawing_attachment TEXT,
ADD COLUMN comments TEXT;

-- Remover o default após adicionar a coluna para novos registros
ALTER TABLE public.assets
ALTER COLUMN manufacturer DROP DEFAULT;

-- Criar índice para otimizar buscas por PAT
CREATE INDEX IF NOT EXISTS idx_assets_asset_code ON public.assets(asset_code);

-- Criar bucket para anexos de equipamentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-attachments', 'equipment-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para o bucket de anexos
CREATE POLICY "Usuários autenticados podem fazer upload de anexos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'equipment-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem visualizar anexos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'equipment-attachments');

CREATE POLICY "Usuários com permissão podem deletar anexos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'equipment-attachments' AND can_user_delete_assets(auth.uid()));