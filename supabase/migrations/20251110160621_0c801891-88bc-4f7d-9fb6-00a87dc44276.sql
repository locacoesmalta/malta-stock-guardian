-- Adicionar campos de tracking de login à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_ip TEXT,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_login 
ON public.profiles(last_login_at DESC);

-- Função para registrar login automaticamente
CREATE OR REPLACE FUNCTION public.update_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    last_login_at = NOW(),
    login_count = COALESCE(login_count, 0) + 1,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger para atualizar automaticamente no login
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
EXECUTE FUNCTION public.update_user_login();

-- Função para buscar novidades do sistema para o usuário
CREATE OR REPLACE FUNCTION public.get_user_welcome_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_low_stock_count INTEGER;
  v_overdue_maintenance_count INTEGER;
  v_pending_reports_count INTEGER;
BEGIN
  -- Contar produtos com estoque baixo/zerado (apenas se o usuário tem permissão)
  IF can_user_view_products(p_user_id) THEN
    SELECT COUNT(*) INTO v_low_stock_count
    FROM products
    WHERE deleted_at IS NULL
    AND (quantity = 0 OR quantity <= min_quantity);
  ELSE
    v_low_stock_count := 0;
  END IF;
  
  -- Contar manutenções atrasadas (apenas se o usuário tem permissão)
  IF can_user_access_assets(p_user_id) THEN
    SELECT COUNT(*) INTO v_overdue_maintenance_count
    FROM assets
    WHERE deleted_at IS NULL
    AND location_type = 'em_manutencao'
    AND maintenance_departure_date IS NULL
    AND maintenance_arrival_date < NOW() - INTERVAL '30 days';
  ELSE
    v_overdue_maintenance_count := 0;
  END IF;
  
  -- Contar relatórios pendentes (apenas se o usuário tem permissão)
  IF can_user_view_reports(p_user_id) THEN
    SELECT COUNT(*) INTO v_pending_reports_count
    FROM reports
    WHERE deleted_at IS NULL
    AND created_by = p_user_id;
  ELSE
    v_pending_reports_count := 0;
  END IF;
  
  -- Montar JSON de resposta
  v_result := json_build_object(
    'low_stock_count', v_low_stock_count,
    'overdue_maintenance_count', v_overdue_maintenance_count,
    'pending_reports_count', v_pending_reports_count,
    'has_news', (v_low_stock_count > 0 OR v_overdue_maintenance_count > 0 OR v_pending_reports_count > 0)
  );
  
  RETURN v_result;
END;
$$;

-- Inicializar last_login_at para usuários antigos
UPDATE public.profiles
SET 
  last_login_at = created_at,
  login_count = 1
WHERE last_login_at IS NULL;