-- Create assets table for patrimônio management
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_code TEXT NOT NULL UNIQUE,
  equipment_name TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('escritorio', 'locacao')),
  rental_company TEXT,
  rental_work_site TEXT,
  rental_start_date DATE,
  rental_end_date DATE,
  qr_code_data TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Policies for assets table
CREATE POLICY "Authenticated users can view assets"
  ON public.assets
  FOR SELECT
  USING (is_user_active(auth.uid()));

CREATE POLICY "Only admins can insert assets"
  ON public.assets
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update assets"
  ON public.assets
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete assets"
  ON public.assets
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster searches
CREATE INDEX idx_assets_code ON public.assets(asset_code);
CREATE INDEX idx_assets_location_type ON public.assets(location_type);