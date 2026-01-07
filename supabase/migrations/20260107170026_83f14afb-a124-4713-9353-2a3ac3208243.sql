-- Inserir eventos FIM DE LOCAÇÃO para substituições antigas que não têm
-- Isso permite que apareçam no filtro de Devoluções com o badge correto

INSERT INTO patrimonio_historico (
  pat_id,
  codigo_pat,
  tipo_evento,
  detalhes_evento,
  data_evento_real,
  data_modificacao,
  usuario_nome,
  usuario_modificacao
)
SELECT 
  ph.pat_id,
  ph.codigo_pat,
  'FIM DE LOCAÇÃO' as tipo_evento,
  'Locação encerrada em ' || TO_CHAR(COALESCE(ph.data_evento_real, ph.data_modificacao), 'DD/MM/YYYY') || 
  ' por SUBSTITUIÇÃO. ' || 
  COALESCE('Empresa: ' || a.rental_company || '. ', '') ||
  COALESCE('Obra: ' || a.rental_work_site || '. ', '') ||
  COALESCE(
    CASE 
      WHEN ph.detalhes_evento ~* 'Substituído pelo PAT \d{6}' 
      THEN REGEXP_REPLACE(ph.detalhes_evento, '.*?(Substituído pelo PAT \d{6}).*', '\1', 'i')
      ELSE NULL
    END,
    ''
  ) as detalhes_evento,
  COALESCE(ph.data_evento_real, ph.data_modificacao),
  NOW(),
  'MIGRAÇÃO AUTOMÁTICA - Retroativo substituições',
  ph.usuario_modificacao
FROM patrimonio_historico ph
LEFT JOIN assets a ON a.id = ph.pat_id
WHERE ph.tipo_evento = 'SUBSTITUIÇÃO'
  AND ph.detalhes_evento ILIKE '%Substituído pelo PAT%'
  AND NOT EXISTS (
    SELECT 1 FROM patrimonio_historico ph2 
    WHERE ph2.pat_id = ph.pat_id 
      AND ph2.tipo_evento = 'FIM DE LOCAÇÃO'
      AND DATE(COALESCE(ph2.data_evento_real, ph2.data_modificacao)) = DATE(COALESCE(ph.data_evento_real, ph.data_modificacao))
      AND ph2.detalhes_evento ILIKE '%SUBSTITUIÇÃO%'
  );