-- Criar tabela para empresas de locação
CREATE TABLE public.rental_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  address TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contract_number TEXT NOT NULL UNIQUE,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('15', '30')),
  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  is_renewed BOOLEAN DEFAULT false,
  rental_start_date DATE,
  rental_end_date DATE,
  daily_rental_price NUMERIC(10, 2),
  equipment_description TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rental_companies ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users with permission can view rental companies"
ON public.rental_companies
FOR SELECT
USING (can_user_access_assets(auth.uid()));

CREATE POLICY "Users with permission can insert rental companies"
ON public.rental_companies
FOR INSERT
WITH CHECK (can_user_create_assets(auth.uid()));

CREATE POLICY "Users with permission can update rental companies"
ON public.rental_companies
FOR UPDATE
USING (can_user_edit_assets(auth.uid()))
WITH CHECK (can_user_edit_assets(auth.uid()));

CREATE POLICY "Users with permission can delete rental companies"
ON public.rental_companies
FOR DELETE
USING (can_user_delete_assets(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_rental_companies_updated_at
BEFORE UPDATE ON public.rental_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para documentos de contratos (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('rental-contracts', 'rental-contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para documentos
CREATE POLICY "Users can view their rental contract documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'rental-contracts' AND can_user_access_assets(auth.uid()));

CREATE POLICY "Users can upload rental contract documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'rental-contracts' AND can_user_create_assets(auth.uid()));

CREATE POLICY "Users can update rental contract documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'rental-contracts' AND can_user_edit_assets(auth.uid()));

CREATE POLICY "Users can delete rental contract documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'rental-contracts' AND can_user_delete_assets(auth.uid()));