-- Criar tabela asset_collaborators para suportar múltiplos colaboradores por equipamento
CREATE TABLE public.asset_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  collaborator_name TEXT NOT NULL,
  assignment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(asset_id, collaborator_name)
);

-- Índices para melhorar performance nas queries
CREATE INDEX idx_asset_collaborators_asset_id ON public.asset_collaborators(asset_id);
CREATE INDEX idx_asset_collaborators_name ON public.asset_collaborators(collaborator_name);

-- Habilitar Row Level Security
ALTER TABLE public.asset_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users with permission can view collaborators"
  ON public.asset_collaborators FOR SELECT
  USING (can_user_access_assets(auth.uid()));

CREATE POLICY "Users with permission can insert collaborators"
  ON public.asset_collaborators FOR INSERT
  WITH CHECK (can_user_edit_assets(auth.uid()));

CREATE POLICY "Users with permission can delete collaborators"
  ON public.asset_collaborators FOR DELETE
  USING (can_user_delete_assets(auth.uid()));

-- Migrar dados existentes do campo malta_collaborator para a nova tabela
INSERT INTO public.asset_collaborators (asset_id, collaborator_name, assignment_date)
SELECT 
  id,
  malta_collaborator,
  COALESCE(maintenance_arrival_date::timestamp with time zone, created_at)
FROM public.assets
WHERE malta_collaborator IS NOT NULL
  AND malta_collaborator != ''
  AND location_type = 'em_manutencao'
ON CONFLICT (asset_id, collaborator_name) DO NOTHING;