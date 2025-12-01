-- Atualizar função de relatório diário com categorização e emojis
CREATE OR REPLACE FUNCTION send_daily_equipment_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report_data jsonb;
BEGIN
  -- Buscar equipamentos disponíveis e categorizar
  WITH available AS (
    SELECT 
      UPPER(TRIM(REGEXP_REPLACE(equipment_name, '\s+', ' ', 'g'))) as normalized_name,
      COUNT(*) as quantity
    FROM assets
    WHERE location_type = 'deposito_malta'
      AND deleted_at IS NULL
    GROUP BY UPPER(TRIM(REGEXP_REPLACE(equipment_name, '\s+', ' ', 'g')))
  ),
  categorized AS (
    SELECT 
      CASE 
        WHEN normalized_name LIKE '%MARTELETE%' THEN 'MARTELETES'
        WHEN normalized_name LIKE '%GERADOR%' OR normalized_name LIKE '%INVERSOR%' THEN 'GERADORES'
        WHEN normalized_name LIKE '%BETONEIRA%' OR normalized_name LIKE '%MISTURADOR%' THEN 'BETONEIRAS'
        WHEN normalized_name LIKE '%ESMERILHADEIRA%' OR normalized_name LIKE '%ESMERILHADERA%' THEN 'ESMERILHADEIRAS'
        WHEN normalized_name LIKE '%PLACA VIBRAT%' THEN 'PLACAS VIBRATÓRIAS'
        WHEN normalized_name LIKE '%SERRA%' THEN 'SERRAS'
        WHEN normalized_name LIKE '%MANGOTE%' THEN 'MANGOTES VIBRATÓRIOS'
        WHEN normalized_name LIKE '%SOLDA%' THEN 'MÁQUINAS DE SOLDA'
        WHEN normalized_name LIKE '%BOMBA%' OR normalized_name LIKE '%MOTOBOMBA%' OR normalized_name LIKE '%MARACA%' THEN 'BOMBAS'
        WHEN normalized_name LIKE '%POLITRIZ%' OR normalized_name LIKE '%LIXADEIRA%' THEN 'POLITRIZES/LIXADEIRAS'
        WHEN normalized_name LIKE '%COMPACTADOR%' OR normalized_name LIKE '%VIBRADOR%' THEN 'COMPACTADORES'
        WHEN normalized_name LIKE '%FURADEIRA%' THEN 'FURADEIRAS'
        WHEN normalized_name LIKE '%MOTOR ACIONADOR%' THEN 'MOTORES'
        ELSE 'OUTROS'
      END as category,
      CASE 
        WHEN normalized_name LIKE '%MARTELETE%' THEN '🔨'
        WHEN normalized_name LIKE '%GERADOR%' OR normalized_name LIKE '%INVERSOR%' THEN '⚡'
        WHEN normalized_name LIKE '%BETONEIRA%' OR normalized_name LIKE '%MISTURADOR%' THEN '🔄'
        WHEN normalized_name LIKE '%ESMERILHADEIRA%' OR normalized_name LIKE '%ESMERILHADERA%' THEN '✨'
        WHEN normalized_name LIKE '%PLACA VIBRAT%' THEN '📳'
        WHEN normalized_name LIKE '%SERRA%' THEN '🪚'
        WHEN normalized_name LIKE '%MANGOTE%' THEN '🔧'
        WHEN normalized_name LIKE '%SOLDA%' THEN '🔥'
        WHEN normalized_name LIKE '%BOMBA%' OR normalized_name LIKE '%MOTOBOMBA%' OR normalized_name LIKE '%MARACA%' THEN '💧'
        WHEN normalized_name LIKE '%POLITRIZ%' OR normalized_name LIKE '%LIXADEIRA%' THEN '💎'
        WHEN normalized_name LIKE '%COMPACTADOR%' OR normalized_name LIKE '%VIBRADOR%' THEN '🏗️'
        WHEN normalized_name LIKE '%FURADEIRA%' THEN '🔩'
        WHEN normalized_name LIKE '%MOTOR ACIONADOR%' THEN '⚙️'
        ELSE '📦'
      END as emoji,
      normalized_name,
      quantity
    FROM available
  ),
  categories_agg AS (
    SELECT 
      category,
      emoji,
      COUNT(*) as total_types,
      SUM(quantity) as total_quantity,
      jsonb_agg(
        jsonb_build_object(
          'name', normalized_name,
          'quantity', quantity
        ) ORDER BY quantity DESC
      ) as equipment
    FROM categorized
    GROUP BY category, emoji
    ORDER BY SUM(quantity) DESC
  ),
  summary_data AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE location_type = 'deposito_malta') as deposito_malta,
      COUNT(*) FILTER (WHERE location_type = 'locacao') as locacao,
      COUNT(*) FILTER (WHERE location_type = 'em_manutencao') as em_manutencao,
      COUNT(*) FILTER (WHERE location_type = 'aguardando_laudo') as aguardando_laudo
    FROM assets
    WHERE deleted_at IS NULL
  )
  SELECT jsonb_build_object(
    'report_type', 'daily_availability',
    'report_date', to_char(now() AT TIME ZONE 'America/Belem', 'DD/MM/YYYY às HH24:MI'),
    'phone', '+5591996280080',
    'summary', (SELECT row_to_json(summary_data.*) FROM summary_data),
    'total_equipment', (SELECT SUM(quantity) FROM available),
    'total_types', (SELECT COUNT(*) FROM available),
    'categories', (SELECT jsonb_agg(
      jsonb_build_object(
        'name', category,
        'emoji', emoji,
        'total_types', total_types,
        'total_quantity', total_quantity,
        'equipment', equipment
      ) ORDER BY total_quantity DESC
    ) FROM categories_agg)
  )
  INTO v_report_data;

  -- Enviar para webhook N8N
  PERFORM net.http_post(
    url := 'https://webhook.7arrows.pro/webhook/diamalta',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := v_report_data
  );

  RAISE NOTICE 'Daily report sent successfully with categories';
END;
$$;