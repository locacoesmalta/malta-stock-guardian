-- ============================================
-- CORREÇÃO: Roles Duplicadas e Privilégios Superuser (v2)
-- ============================================

-- 1. LIMPAR ROLES DUPLICADAS (manter apenas a mais alta)
DO $$
BEGIN
  WITH duplicates AS (
    SELECT user_id, 
           array_agg(id ORDER BY 
             CASE role 
               WHEN 'admin' THEN 1 
               WHEN 'superuser' THEN 2 
               ELSE 3 
             END
           ) as ids
    FROM public.user_roles
    GROUP BY user_id
    HAVING COUNT(*) > 1
  )
  DELETE FROM public.user_roles 
  WHERE id IN (
    SELECT unnest(ids[2:]) FROM duplicates
  );
END $$;

-- 2. ADICIONAR CONSTRAINT para garantir UMA role por usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_unique'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 3. CRIAR FUNÇÃO HELPER para admin OU superuser
CREATE OR REPLACE FUNCTION public.is_admin_or_superuser(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'superuser')
  )
$$;

COMMENT ON FUNCTION public.is_admin_or_superuser IS 
'Verifica se usuário é admin OU superuser (privilégios elevados)';