-- Criar sequences para numeração automática independente
CREATE SEQUENCE IF NOT EXISTS receipt_entrega_number_seq START WITH 14000;
CREATE SEQUENCE IF NOT EXISTS receipt_devolucao_number_seq START WITH 1596;

-- Criar tabela principal de comprovantes
CREATE TABLE IF NOT EXISTS public.equipment_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number INTEGER NOT NULL,
  receipt_type TEXT NOT NULL CHECK (receipt_type IN ('entrega', 'devolucao')),
  client_name TEXT NOT NULL,
  work_site TEXT NOT NULL,
  receipt_date DATE NOT NULL,
  operation_nature TEXT,
  received_by TEXT NOT NULL,
  received_by_malta TEXT,
  signature TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Campos preparados para integrações futuras
  asset_id UUID REFERENCES public.assets(id),
  pdf_url TEXT,
  digital_signature JSONB,
  UNIQUE(receipt_number, receipt_type)
);

-- Criar tabela de items dos comprovantes
CREATE TABLE IF NOT EXISTS public.equipment_receipt_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id UUID NOT NULL REFERENCES public.equipment_receipts(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  specification TEXT NOT NULL,
  item_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar indexes para melhor performance
CREATE INDEX IF NOT EXISTS idx_receipts_type ON public.equipment_receipts(receipt_type);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON public.equipment_receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_receipts_client ON public.equipment_receipts(client_name);
CREATE INDEX IF NOT EXISTS idx_receipts_created_by ON public.equipment_receipts(created_by);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON public.equipment_receipt_items(receipt_id);

-- Habilitar RLS
ALTER TABLE public.equipment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_receipt_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para equipment_receipts
CREATE POLICY "Users with permission can create receipts"
ON public.equipment_receipts
FOR INSERT
TO authenticated
WITH CHECK (
  can_user_create_reports(auth.uid()) AND 
  auth.uid() = created_by
);

CREATE POLICY "Users with permission can view receipts"
ON public.equipment_receipts
FOR SELECT
TO authenticated
USING (can_user_view_reports(auth.uid()));

CREATE POLICY "Users with permission can update receipts"
ON public.equipment_receipts
FOR UPDATE
TO authenticated
USING (can_user_edit_reports(auth.uid()));

CREATE POLICY "Users with permission can delete receipts"
ON public.equipment_receipts
FOR DELETE
TO authenticated
USING (can_user_delete_reports(auth.uid()));

-- Políticas RLS para equipment_receipt_items
CREATE POLICY "Users can create receipt items if they can create receipts"
ON public.equipment_receipt_items
FOR INSERT
TO authenticated
WITH CHECK (
  can_user_create_reports(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.equipment_receipts
    WHERE id = receipt_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can view receipt items if they can view receipts"
ON public.equipment_receipt_items
FOR SELECT
TO authenticated
USING (
  can_user_view_reports(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.equipment_receipts
    WHERE id = receipt_id
  )
);

CREATE POLICY "Users can delete receipt items if they can delete receipts"
ON public.equipment_receipt_items
FOR DELETE
TO authenticated
USING (can_user_delete_reports(auth.uid()));

-- Trigger para updated_at automático
CREATE TRIGGER update_equipment_receipts_updated_at
  BEFORE UPDATE ON public.equipment_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para log de alterações nos comprovantes
CREATE OR REPLACE FUNCTION public.log_receipts_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_user_name text;
  v_log_hash text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE WARNING 'Audit log: No authenticated user context for receipts operation';
  END IF;

  SELECT email, full_name INTO v_user_email, v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'INSERT', 'equipment_receipts', NEW.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      new_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(), 
      COALESCE(v_user_email, 'unknown'), 
      v_user_name,
      'INSERT',
      'equipment_receipts',
      NEW.id,
      to_jsonb(NEW),
      'log_receipts_changes',
      v_log_hash
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'UPDATE', 'equipment_receipts', NEW.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      old_data, new_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(), 
      COALESCE(v_user_email, 'unknown'), 
      v_user_name,
      'UPDATE',
      'equipment_receipts',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      'log_receipts_changes',
      v_log_hash
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_log_hash := public.generate_audit_log_hash(
      auth.uid(), 'DELETE', 'equipment_receipts', OLD.id, NOW()
    );
    
    INSERT INTO public.audit_logs (
      user_id, user_email, user_name, action, table_name, record_id, 
      old_data, inserted_by_trigger, log_hash
    ) VALUES (
      auth.uid(), 
      COALESCE(v_user_email, 'unknown'), 
      v_user_name,
      'DELETE',
      'equipment_receipts',
      OLD.id,
      to_jsonb(OLD),
      'log_receipts_changes',
      v_log_hash
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar trigger de audit
CREATE TRIGGER log_equipment_receipts_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.equipment_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_receipts_changes();