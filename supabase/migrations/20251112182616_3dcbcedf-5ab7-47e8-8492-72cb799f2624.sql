-- Migration: drop_old_registrar_evento_patrimonio_7_params
-- Description: Remove versão antiga da função registrar_evento_patrimonio (7 parâmetros)
--              para evitar conflitos de overloading. Mantém apenas versão com 8 parâmetros.

DROP FUNCTION IF EXISTS public.registrar_evento_patrimonio(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text
);

-- Comentário: A versão com 8 parâmetros (incluindo p_data_evento_real) permanece ativa