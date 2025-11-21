-- CORREÇÃO IMEDIATA: PAT 000190 deve estar em locação (CCM - MURUTUCU)
-- Este equipamento substituiu o PAT 000152 em 18/11/2025

-- 1. Atualizar o PAT 000190 para locação com dados corretos
UPDATE assets
SET 
  location_type = 'locacao',
  rental_company = 'CCM',
  rental_work_site = 'MURUTUCU',
  rental_start_date = '2025-11-18',
  rental_contract_number = (
    SELECT rental_contract_number 
    FROM assets 
    WHERE id = 'e9d49614-6114-4a94-bf27-5fef940efccb'
  ),
  updated_at = NOW()
WHERE id = '71937b8e-b693-4332-ba4e-6f3a9a7c39b9';

-- 2. Registrar evento no histórico
INSERT INTO patrimonio_historico (
  pat_id,
  codigo_pat,
  tipo_evento,
  detalhes_evento,
  campo_alterado,
  valor_antigo,
  valor_novo,
  data_modificacao,
  data_evento_real
) VALUES (
  '71937b8e-b693-4332-ba4e-6f3a9a7c39b9',
  '000190',
  'CORREÇÃO AUTOMÁTICA',
  'Status corrigido automaticamente: equipamento substituiu PAT 000152 que estava em locação (CCM - MURUTUCU). O substituto deveria ter herdado automaticamente o status de locação.',
  'location_type',
  'aguardando_laudo',
  'locacao',
  NOW(),
  '2025-11-18'
);