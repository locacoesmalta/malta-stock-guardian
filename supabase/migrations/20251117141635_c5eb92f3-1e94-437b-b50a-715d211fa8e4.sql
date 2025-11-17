-- Adicionar colunas de metadata para processamento de fotos
ALTER TABLE report_photos ADD COLUMN IF NOT EXISTS rotation_applied integer DEFAULT 0;
ALTER TABLE report_photos ADD COLUMN IF NOT EXISTS flip_horizontal boolean DEFAULT false;
ALTER TABLE report_photos ADD COLUMN IF NOT EXISTS flip_vertical boolean DEFAULT false;
ALTER TABLE report_photos ADD COLUMN IF NOT EXISTS original_width integer;
ALTER TABLE report_photos ADD COLUMN IF NOT EXISTS original_height integer;
ALTER TABLE report_photos ADD COLUMN IF NOT EXISTS processed_width integer;
ALTER TABLE report_photos ADD COLUMN IF NOT EXISTS processed_height integer;
ALTER TABLE report_photos ADD COLUMN IF NOT EXISTS original_size_bytes bigint;
ALTER TABLE report_photos ADD COLUMN IF NOT EXISTS processed_size_bytes bigint;
ALTER TABLE report_photos ADD COLUMN IF NOT EXISTS processing_applied boolean DEFAULT false;

COMMENT ON COLUMN report_photos.rotation_applied IS 'Rotação aplicada em graus (0, 90, 180, 270)';
COMMENT ON COLUMN report_photos.flip_horizontal IS 'Se foi aplicado flip horizontal';
COMMENT ON COLUMN report_photos.flip_vertical IS 'Se foi aplicado flip vertical';
COMMENT ON COLUMN report_photos.original_width IS 'Largura original da foto em pixels';
COMMENT ON COLUMN report_photos.original_height IS 'Altura original da foto em pixels';
COMMENT ON COLUMN report_photos.processed_width IS 'Largura processada da foto em pixels';
COMMENT ON COLUMN report_photos.processed_height IS 'Altura processada da foto em pixels';
COMMENT ON COLUMN report_photos.original_size_bytes IS 'Tamanho original do arquivo em bytes';
COMMENT ON COLUMN report_photos.processed_size_bytes IS 'Tamanho processado do arquivo em bytes';
COMMENT ON COLUMN report_photos.processing_applied IS 'Se algum processamento foi aplicado à foto';