-- Criar tabela para colaboradores de retiradas de material
CREATE TABLE public.material_withdrawal_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id UUID NOT NULL REFERENCES public.material_withdrawals(id) ON DELETE CASCADE,
  collaborator_name TEXT NOT NULL,
  is_principal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(withdrawal_id, collaborator_name)
);

-- Índices para performance
CREATE INDEX idx_withdrawal_collaborators_withdrawal_id 
  ON public.material_withdrawal_collaborators(withdrawal_id);

CREATE INDEX idx_withdrawal_collaborators_name 
  ON public.material_withdrawal_collaborators(collaborator_name);

-- RLS Policies
ALTER TABLE public.material_withdrawal_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view withdrawal collaborators if active"
  ON public.material_withdrawal_collaborators FOR SELECT
  USING (is_user_active(auth.uid()));

CREATE POLICY "Users with permission can insert withdrawal collaborators"
  ON public.material_withdrawal_collaborators FOR INSERT
  WITH CHECK (can_user_create_withdrawals(auth.uid()));

CREATE POLICY "Admins can delete withdrawal collaborators"
  ON public.material_withdrawal_collaborators FOR DELETE
  USING (is_admin(auth.uid()));

-- Remover função antiga para recriar com novo tipo de retorno
DROP FUNCTION IF EXISTS public.get_collaborator_details(text, date, date);

-- Recriar função get_collaborator_details com coluna service_type
CREATE FUNCTION public.get_collaborator_details(
  p_collaborator_name text,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  asset_code text,
  equipment_name text,
  maintenance_company text,
  maintenance_work_site text,
  maintenance_arrival_date date,
  maintenance_departure_date date,
  maintenance_delay_observations text,
  days_in_maintenance integer,
  all_collaborators text[],
  service_type text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Manutenção externa (já existente)
  SELECT 
    a.id,
    a.asset_code,
    a.equipment_name,
    a.maintenance_company,
    a.maintenance_work_site,
    a.maintenance_arrival_date,
    a.maintenance_departure_date,
    a.maintenance_delay_observations,
    CASE 
      WHEN a.maintenance_departure_date IS NULL 
      THEN CURRENT_DATE - a.maintenance_arrival_date
      ELSE a.maintenance_departure_date - a.maintenance_arrival_date
    END as days_in_maintenance,
    ARRAY_AGG(DISTINCT ac2.collaborator_name ORDER BY ac2.collaborator_name) as all_collaborators,
    'manutencao_externa'::text as service_type
  FROM assets a
  INNER JOIN asset_collaborators ac ON ac.asset_id = a.id
  LEFT JOIN asset_collaborators ac2 ON ac2.asset_id = a.id
  WHERE ac.collaborator_name = p_collaborator_name
    AND a.location_type = 'em_manutencao'
    AND (p_start_date IS NULL OR a.maintenance_arrival_date >= p_start_date)
    AND (p_end_date IS NULL OR a.maintenance_arrival_date <= p_end_date)
  GROUP BY a.id, a.asset_code, a.equipment_name, a.maintenance_company, 
           a.maintenance_work_site, a.maintenance_arrival_date, 
           a.maintenance_departure_date, a.maintenance_delay_observations
  
  UNION ALL
  
  -- Manutenção interna (NOVO)
  SELECT 
    mw.id,
    mw.equipment_code as asset_code,
    COALESCE(ast.equipment_name, 'Equipamento não encontrado') as equipment_name,
    mw.company as maintenance_company,
    mw.work_site as maintenance_work_site,
    mw.withdrawal_date as maintenance_arrival_date,
    NULL::date as maintenance_departure_date,
    mw.withdrawal_reason as maintenance_delay_observations,
    CURRENT_DATE - mw.withdrawal_date as days_in_maintenance,
    ARRAY_AGG(DISTINCT mwc2.collaborator_name ORDER BY mwc2.collaborator_name) as all_collaborators,
    'manutencao_interna'::text as service_type
  FROM material_withdrawals mw
  INNER JOIN material_withdrawal_collaborators mwc ON mwc.withdrawal_id = mw.id
  LEFT JOIN material_withdrawal_collaborators mwc2 ON mwc2.withdrawal_id = mw.id
  LEFT JOIN assets ast ON ast.asset_code = mw.equipment_code
  WHERE mwc.collaborator_name = p_collaborator_name
    AND mw.company = 'Manutenção Interna'
    AND (p_start_date IS NULL OR mw.withdrawal_date >= p_start_date)
    AND (p_end_date IS NULL OR mw.withdrawal_date <= p_end_date)
  GROUP BY mw.id, mw.equipment_code, ast.equipment_name, mw.company, 
           mw.work_site, mw.withdrawal_date, mw.withdrawal_reason
  
  ORDER BY maintenance_arrival_date DESC;
$$;

-- Remover função antiga para recriar com nova lógica
DROP FUNCTION IF EXISTS public.get_monthly_productivity(integer, integer);

-- Recriar função get_monthly_productivity incluindo manutenção interna
CREATE FUNCTION public.get_monthly_productivity(
  p_year integer,
  p_month integer
)
RETURNS TABLE(
  collaborator_name text,
  equipment_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH external_maintenance AS (
    SELECT 
      ac.collaborator_name,
      COUNT(DISTINCT a.id) as equipment_count
    FROM asset_collaborators ac
    INNER JOIN assets a ON ac.asset_id = a.id
    WHERE a.location_type = 'em_manutencao'
      AND EXTRACT(YEAR FROM a.maintenance_arrival_date) = p_year
      AND EXTRACT(MONTH FROM a.maintenance_arrival_date) = p_month
    GROUP BY ac.collaborator_name
  ),
  internal_maintenance AS (
    SELECT 
      mwc.collaborator_name,
      COUNT(DISTINCT mw.equipment_code) as equipment_count
    FROM material_withdrawal_collaborators mwc
    INNER JOIN material_withdrawals mw ON mwc.withdrawal_id = mw.id
    WHERE mw.company = 'Manutenção Interna'
      AND EXTRACT(YEAR FROM mw.withdrawal_date) = p_year
      AND EXTRACT(MONTH FROM mw.withdrawal_date) = p_month
    GROUP BY mwc.collaborator_name
  )
  SELECT 
    collaborator_name,
    SUM(equipment_count) as equipment_count
  FROM (
    SELECT * FROM external_maintenance
    UNION ALL
    SELECT * FROM internal_maintenance
  ) combined
  GROUP BY collaborator_name
  ORDER BY equipment_count DESC;
$$;