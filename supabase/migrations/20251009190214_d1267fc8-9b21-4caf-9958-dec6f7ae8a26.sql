-- Criar tabela para caixas
CREATE TABLE public.cash_boxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opened_by UUID NOT NULL REFERENCES auth.users(id),
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  initial_value NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para transações do caixa
CREATE TABLE public.cash_box_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_box_id UUID NOT NULL REFERENCES public.cash_boxes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'devolucao')),
  value NUMERIC NOT NULL,
  description TEXT,
  observations TEXT,
  attachment_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar bucket para anexos do caixa
INSERT INTO storage.buckets (id, name, public) VALUES ('cash-box-attachments', 'cash-box-attachments', false);

-- Enable RLS
ALTER TABLE public.cash_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_box_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para cash_boxes
CREATE POLICY "Users with permission can view cash boxes"
ON public.cash_boxes FOR SELECT
USING (can_user_access_assets(auth.uid()));

CREATE POLICY "Users with permission can create cash boxes"
ON public.cash_boxes FOR INSERT
WITH CHECK (can_user_create_assets(auth.uid()) AND auth.uid() = opened_by);

CREATE POLICY "Users with permission can update cash boxes"
ON public.cash_boxes FOR UPDATE
USING (can_user_edit_assets(auth.uid()));

CREATE POLICY "Users with permission can delete cash boxes"
ON public.cash_boxes FOR DELETE
USING (can_user_delete_assets(auth.uid()));

-- RLS Policies para cash_box_transactions
CREATE POLICY "Users with permission can view transactions"
ON public.cash_box_transactions FOR SELECT
USING (can_user_access_assets(auth.uid()));

CREATE POLICY "Users with permission can create transactions"
ON public.cash_box_transactions FOR INSERT
WITH CHECK (can_user_create_assets(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Users with permission can update transactions"
ON public.cash_box_transactions FOR UPDATE
USING (can_user_edit_assets(auth.uid()));

CREATE POLICY "Users with permission can delete transactions"
ON public.cash_box_transactions FOR DELETE
USING (can_user_delete_assets(auth.uid()));

-- Storage policies para cash-box-attachments
CREATE POLICY "Users can view their attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'cash-box-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cash-box-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cash-box-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'cash-box-attachments' AND auth.uid() IS NOT NULL);

-- Triggers para updated_at
CREATE TRIGGER update_cash_boxes_updated_at
BEFORE UPDATE ON public.cash_boxes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_box_transactions_updated_at
BEFORE UPDATE ON public.cash_box_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();