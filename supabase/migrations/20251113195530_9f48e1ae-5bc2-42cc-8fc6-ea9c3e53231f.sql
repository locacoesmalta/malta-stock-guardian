-- Remove trigger de validação de datas de movimentação de ativos
-- 
-- MOTIVO DA REMOÇÃO:
-- O sistema agora suporta cadastros retroativos para permitir
-- regularização de equipamentos com datas anteriores ao cadastro.
-- Validações temporais agora são feitas no frontend via soft warnings,
-- registrando inconsistências no histórico para auditoria posterior.
-- 
-- VALIDAÇÕES QUE PERMANECEM:
-- - Data de substituição não pode ser futura (validação frontend)
-- - rental_end_date > rental_start_date (trigger validate_rental_dates_on_insert_update)
-- - maintenance_departure_date >= maintenance_arrival_date (constraints de tabela)
--
-- RASTREABILIDADE:
-- Inconsistências temporais são registradas no patrimonio_historico
-- com flags específicas para auditoria futura.

-- Remove o trigger
DROP TRIGGER IF EXISTS check_asset_movement_dates ON public.assets;

-- Remove a função associada
DROP FUNCTION IF EXISTS public.validate_asset_movement_dates();