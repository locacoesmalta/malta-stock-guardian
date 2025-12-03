-- Tabela de templates de verificação para planos de manutenção
CREATE TABLE IF NOT EXISTS public.maintenance_verification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  verification_sections JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca hierárquica eficiente
CREATE INDEX idx_templates_equipment_hierarchy 
ON public.maintenance_verification_templates (equipment_type, manufacturer, model);

-- Habilitar RLS
ALTER TABLE public.maintenance_verification_templates ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem visualizar templates
CREATE POLICY "Authenticated users can view templates"
ON public.maintenance_verification_templates
FOR SELECT
USING (is_user_active(auth.uid()));

-- Superusers e admins podem criar/editar templates
CREATE POLICY "Superusers and admins can insert templates"
ON public.maintenance_verification_templates
FOR INSERT
WITH CHECK (is_admin_or_superuser(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Superusers and admins can update templates"
ON public.maintenance_verification_templates
FOR UPDATE
USING (is_admin_or_superuser(auth.uid()));

CREATE POLICY "Superusers and admins can delete templates"
ON public.maintenance_verification_templates
FOR DELETE
USING (is_admin_or_superuser(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.maintenance_verification_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_asset_maintenance_updated_at();