-- Adicionar campos para controle de retorno à obra e troca de equipamentos
ALTER TABLE public.assets
ADD COLUMN returns_to_work_site boolean DEFAULT null,
ADD COLUMN was_replaced boolean DEFAULT null,
ADD COLUMN replaced_by_asset_id uuid REFERENCES public.assets(id) ON DELETE SET NULL,
ADD COLUMN replacement_reason text;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.assets.returns_to_work_site IS 'Se o equipamento em manutenção vai voltar para a obra';
COMMENT ON COLUMN public.assets.was_replaced IS 'Se o equipamento foi trocado por outro';
COMMENT ON COLUMN public.assets.replaced_by_asset_id IS 'ID do equipamento que substituiu este';
COMMENT ON COLUMN public.assets.replacement_reason IS 'Motivo da troca de equipamento';