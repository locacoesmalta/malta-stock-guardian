-- Adicionar colunas de auditoria para rastrear edições em caixas fechados
ALTER TABLE cash_boxes
ADD COLUMN edited_by uuid REFERENCES auth.users(id),
ADD COLUMN edited_at timestamp with time zone;

-- Criar índice para melhorar performance de queries de auditoria
CREATE INDEX idx_cash_boxes_edited_by ON cash_boxes(edited_by);
CREATE INDEX idx_cash_boxes_edited_at ON cash_boxes(edited_at);