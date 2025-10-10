-- Função para buscar produtividade mensal por colaborador
CREATE OR REPLACE FUNCTION public.get_monthly_productivity(p_year integer, p_month integer)
RETURNS TABLE (
  collaborator_name text,
  equipment_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ac.collaborator_name,
    COUNT(DISTINCT a.id) as equipment_count
  FROM asset_collaborators ac
  INNER JOIN assets a ON ac.asset_id = a.id
  WHERE a.location_type = 'em_manutencao'
    AND EXTRACT(YEAR FROM a.maintenance_arrival_date) = p_year
    AND EXTRACT(MONTH FROM a.maintenance_arrival_date) = p_month
  GROUP BY ac.collaborator_name
  ORDER BY equipment_count DESC;
$$;

-- Função para buscar detalhes dos equipamentos de um colaborador
CREATE OR REPLACE FUNCTION public.get_collaborator_details(
  p_collaborator_name text,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  asset_code text,
  equipment_name text,
  maintenance_company text,
  maintenance_work_site text,
  maintenance_arrival_date date,
  maintenance_departure_date date,
  maintenance_delay_observations text,
  days_in_maintenance integer,
  all_collaborators text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    ARRAY_AGG(DISTINCT ac2.collaborator_name ORDER BY ac2.collaborator_name) as all_collaborators
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
  ORDER BY a.maintenance_arrival_date DESC;
$$;