
-- ============================================
-- CORREÇÃO: Function Search Path Mutable
-- Adicionar search_path fixo para segurança
-- ============================================

-- Recriar a função com search_path seguro
CREATE OR REPLACE FUNCTION public.update_asset_maintenance_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'  -- Fixar search_path para prevenir hijacking
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Comentário explicativo
COMMENT ON FUNCTION public.update_asset_maintenance_updated_at() IS 
'Atualiza automaticamente o campo updated_at em asset_maintenances. Search path fixo para segurança.';
