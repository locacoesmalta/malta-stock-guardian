-- Adicionar coluna withdrawal_id em report_parts para vincular à retirada original
ALTER TABLE public.report_parts
ADD COLUMN IF NOT EXISTS withdrawal_id UUID REFERENCES public.material_withdrawals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_report_parts_withdrawal_id ON public.report_parts(withdrawal_id);

-- Adicionar coluna used_in_report_id em material_withdrawals para marcar retiradas já usadas
ALTER TABLE public.material_withdrawals
ADD COLUMN IF NOT EXISTS used_in_report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_material_withdrawals_used_in_report ON public.material_withdrawals(used_in_report_id);
CREATE INDEX IF NOT EXISTS idx_material_withdrawals_equipment_code ON public.material_withdrawals(equipment_code);

-- Permitir atualização de used_in_report_id quando criar relatório
DROP POLICY IF EXISTS "Users can mark withdrawals as used in reports" ON public.material_withdrawals;

CREATE POLICY "Users can mark withdrawals as used in reports"
ON public.material_withdrawals
FOR UPDATE
TO authenticated
USING (can_user_create_reports(auth.uid()))
WITH CHECK (can_user_create_reports(auth.uid()));