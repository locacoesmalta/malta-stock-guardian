-- Inserir FIM DE LOCAÇÃO para aprovações pós-laudo que não têm registro de devolução
INSERT INTO patrimonio_historico (
  pat_id,
  codigo_pat,
  tipo_evento,
  detalhes_evento,
  data_evento_real,
  data_modificacao,
  usuario_nome,
  registro_retroativo
)
SELECT 
  ph.pat_id,
  ph.codigo_pat,
  'FIM DE LOCAÇÃO' as tipo_evento,
  'Locação encerrada em ' || TO_CHAR(ph.data_modificacao AT TIME ZONE 'America/Belem', 'DD/MM/YYYY') || '. ' ||
  COALESCE(
    CASE WHEN ph.detalhes_evento ~* 'Empresa: ([^|.]+)' 
         THEN REGEXP_REPLACE(ph.detalhes_evento, '.*Empresa: ([^|.]+).*', 'Empresa: \1', 'i') || '. '
         ELSE '' END, 
    ''
  ) ||
  COALESCE(
    CASE WHEN ph.detalhes_evento ~* 'Obra: ([^|.]+)' 
         THEN REGEXP_REPLACE(ph.detalhes_evento, '.*Obra: ([^|.]+).*', 'Obra: \1', 'i') || '. '
         ELSE '' END, 
    ''
  ) ||
  'Retorno via aprovação de laudo. (Migração retroativa)' as detalhes_evento,
  DATE(ph.data_modificacao AT TIME ZONE 'America/Belem') as data_evento_real,
  ph.data_modificacao as data_modificacao,
  'MIGRAÇÃO AUTOMÁTICA' as usuario_nome,
  true as registro_retroativo
FROM patrimonio_historico ph
WHERE ph.tipo_evento = 'DECISÃO PÓS-LAUDO'
  AND (ph.detalhes_evento ILIKE '%disponível para%locação%' 
       OR ph.detalhes_evento ILIKE '%disponibilizado para locação%')
  AND NOT EXISTS (
    SELECT 1 FROM patrimonio_historico ph2 
    WHERE ph2.pat_id = ph.pat_id 
      AND ph2.tipo_evento = 'FIM DE LOCAÇÃO'
      AND DATE(ph2.data_modificacao AT TIME ZONE 'America/Belem') = DATE(ph.data_modificacao AT TIME ZONE 'America/Belem')
  );