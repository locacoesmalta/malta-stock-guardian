-- Add CPF/Matrícula columns for supervisor, technician, and client
ALTER TABLE public.maintenance_plans 
ADD COLUMN IF NOT EXISTS supervisor_cpf TEXT,
ADD COLUMN IF NOT EXISTS technician_cpf TEXT,
ADD COLUMN IF NOT EXISTS client_cpf TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.maintenance_plans.supervisor_cpf IS 'CPF ou Matrícula do Supervisor';
COMMENT ON COLUMN public.maintenance_plans.technician_cpf IS 'CPF ou Matrícula do Técnico';
COMMENT ON COLUMN public.maintenance_plans.client_cpf IS 'CPF ou Matrícula do Cliente';