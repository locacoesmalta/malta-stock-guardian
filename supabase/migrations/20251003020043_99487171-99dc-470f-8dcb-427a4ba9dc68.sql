-- Adicionar campo de controle de entrada no laudo
ALTER TABLE assets 
ADD COLUMN inspection_start_date timestamp with time zone;

-- Adicionar comentário para documentação
COMMENT ON COLUMN assets.inspection_start_date IS 
'Data de entrada no status aguardando_laudo para controle de prazo de 5 dias';