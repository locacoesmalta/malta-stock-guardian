-- ============================================================================
-- MALTA STOCK GUARDIAN - SCRIPT DE CRIAÇÃO DO BANCO EXTERNO
-- ============================================================================
-- Este script cria todas as 39 tabelas do sistema no Supabase externo
-- Estrutura idêntica ao banco interno, sem RLS policies e foreign keys
-- Execute este script no SQL Editor do seu Supabase externo
-- ============================================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABELA: profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,
  login_count INTEGER DEFAULT 0
);

-- ============================================================================
-- TABELA: user_roles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: user_permissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  can_view_products BOOLEAN DEFAULT TRUE,
  can_edit_products BOOLEAN DEFAULT FALSE,
  can_delete_products BOOLEAN DEFAULT FALSE,
  can_create_reports BOOLEAN DEFAULT FALSE,
  can_view_reports BOOLEAN DEFAULT TRUE,
  can_edit_reports BOOLEAN DEFAULT FALSE,
  can_delete_reports BOOLEAN DEFAULT FALSE,
  can_access_main_menu BOOLEAN DEFAULT FALSE,
  can_access_admin BOOLEAN DEFAULT FALSE,
  can_create_withdrawals BOOLEAN DEFAULT FALSE,
  can_view_withdrawal_history BOOLEAN DEFAULT FALSE,
  can_access_assets BOOLEAN DEFAULT FALSE,
  can_create_assets BOOLEAN DEFAULT FALSE,
  can_edit_assets BOOLEAN DEFAULT FALSE,
  can_delete_assets BOOLEAN DEFAULT FALSE,
  can_scan_assets BOOLEAN DEFAULT FALSE,
  can_view_financial_data BOOLEAN DEFAULT FALSE,
  must_change_password BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: user_presence
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  is_online BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  browser_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: products
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  manufacturer TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  purchase_price NUMERIC,
  sale_price NUMERIC,
  payment_type TEXT,
  last_purchase_date DATE,
  equipment_type TEXT,
  equipment_brand TEXT,
  equipment_model TEXT,
  comments TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- TABELA: product_purchases
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  purchase_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  purchase_price NUMERIC,
  sale_price NUMERIC,
  payment_type TEXT NOT NULL,
  operator_id UUID,
  operator_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: product_stock_adjustments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  adjusted_by UUID NOT NULL,
  adjustment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: assets
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT,
  serial_number TEXT,
  voltage_combustion TEXT,
  location_type TEXT NOT NULL,
  qr_code_data TEXT,
  supplier TEXT,
  purchase_date DATE,
  unit_value NUMERIC,
  available_for_rental BOOLEAN DEFAULT FALSE,
  is_new_equipment BOOLEAN DEFAULT TRUE,
  equipment_condition TEXT,
  manual_attachment TEXT,
  exploded_drawing_attachment TEXT,
  comments TEXT,
  deposito_description TEXT,
  rental_company TEXT,
  rental_work_site TEXT,
  rental_contract_number TEXT,
  rental_start_date DATE,
  rental_end_date DATE,
  rental_photo_1 TEXT,
  rental_photo_2 TEXT,
  maintenance_company TEXT,
  maintenance_work_site TEXT,
  maintenance_description TEXT,
  maintenance_status TEXT DEFAULT 'sem_dados',
  maintenance_arrival_date DATE,
  maintenance_departure_date DATE,
  maintenance_interval INTEGER,
  next_maintenance_hourmeter INTEGER,
  maintenance_delay_observations TEXT,
  equipment_observations TEXT,
  destination_after_maintenance TEXT,
  malta_collaborator TEXT,
  inspection_start_date TIMESTAMPTZ,
  returns_to_work_site BOOLEAN,
  was_washed BOOLEAN,
  was_painted BOOLEAN,
  was_replaced BOOLEAN,
  replaced_by_asset_id UUID,
  replacement_reason TEXT,
  retroactive_registration_notes TEXT,
  retroactive_justification TEXT,
  effective_registration_date DATE,
  substitution_date DATE,
  locked_for_manual_edit BOOLEAN DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- TABELA: asset_collaborators
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.asset_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  collaborator_name TEXT NOT NULL,
  assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: asset_lifecycle_history
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.asset_lifecycle_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID,
  asset_code TEXT NOT NULL,
  cycle_number INTEGER NOT NULL,
  cycle_started_at TIMESTAMPTZ DEFAULT NOW(),
  cycle_closed_at TIMESTAMPTZ,
  closed_by UUID,
  reason TEXT,
  archived_withdrawals_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABELA: asset_maintenances
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.asset_maintenances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  maintenance_type TEXT NOT NULL,
  maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_maintenance_date DATE,
  previous_hourmeter INTEGER NOT NULL DEFAULT 0,
  current_hourmeter INTEGER NOT NULL DEFAULT 0,
  total_hourmeter INTEGER,
  services_performed TEXT NOT NULL,
  observations TEXT,
  technician_name TEXT,
  labor_cost NUMERIC DEFAULT 0,
  parts_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC,
  registered_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: asset_maintenance_parts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.asset_maintenance_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: asset_mobilization_expenses
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.asset_mobilization_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  expense_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  collaborator_name TEXT,
  travel_date DATE,
  shipment_date DATE,
  return_date DATE,
  sent_by TEXT,
  received_by TEXT,
  registered_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: asset_mobilization_parts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.asset_mobilization_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  product_id UUID,
  mobilization_asset_id UUID,
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC NOT NULL,
  total_cost NUMERIC,
  purchase_date DATE NOT NULL,
  notes TEXT,
  registered_by UUID NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: asset_spare_parts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.asset_spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  notes TEXT,
  registered_by UUID NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: equipment_receipts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.equipment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number INTEGER NOT NULL,
  receipt_type TEXT NOT NULL,
  receipt_date DATE NOT NULL,
  client_name TEXT NOT NULL,
  work_site TEXT NOT NULL,
  operation_nature TEXT,
  received_by TEXT NOT NULL,
  received_by_cpf TEXT,
  received_by_cpf_encrypted TEXT,
  received_by_malta TEXT,
  malta_operator TEXT,
  whatsapp TEXT,
  signature TEXT,
  digital_signature JSONB,
  pdf_url TEXT,
  asset_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- TABELA: equipment_receipt_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.equipment_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL,
  specification TEXT NOT NULL,
  pat_code TEXT,
  quantity INTEGER NOT NULL,
  item_order INTEGER NOT NULL,
  photos JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: equipment_rental_catalog
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.equipment_rental_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT DEFAULT 'UN',
  price_15_days NUMERIC,
  price_30_days NUMERIC,
  daily_rate_15 NUMERIC,
  daily_rate_30 NUMERIC,
  special_rules TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABELA: rental_companies
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rental_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  address TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contract_number TEXT NOT NULL,
  contract_type TEXT NOT NULL,
  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  is_renewed BOOLEAN DEFAULT FALSE,
  rental_start_date DATE,
  rental_end_date DATE,
  daily_rental_price NUMERIC,
  equipment_description TEXT,
  documents JSONB DEFAULT '[]'::JSONB,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: rental_equipment
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rental_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_company_id UUID NOT NULL,
  asset_code TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  work_site TEXT,
  asset_id UUID,
  pickup_date DATE NOT NULL,
  return_date DATE,
  daily_rate NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: reports
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_code TEXT NOT NULL DEFAULT '',
  equipment_name TEXT,
  work_site TEXT NOT NULL,
  company TEXT NOT NULL,
  technician_name TEXT NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  service_comments TEXT NOT NULL,
  considerations TEXT,
  observations TEXT,
  receiver TEXT,
  responsible TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- TABELA: report_parts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.report_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL,
  product_id UUID NOT NULL,
  withdrawal_id UUID,
  quantity_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: report_photos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.report_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  photo_comment TEXT NOT NULL,
  photo_order INTEGER NOT NULL,
  rotation_applied INTEGER DEFAULT 0,
  flip_horizontal BOOLEAN DEFAULT FALSE,
  flip_vertical BOOLEAN DEFAULT FALSE,
  original_width INTEGER,
  original_height INTEGER,
  processed_width INTEGER,
  processed_height INTEGER,
  original_size_bytes BIGINT,
  processed_size_bytes BIGINT,
  processing_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: report_external_services
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.report_external_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL,
  service_description TEXT NOT NULL,
  service_value NUMERIC NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: material_withdrawals
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.material_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_code TEXT NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  work_site TEXT NOT NULL,
  company TEXT NOT NULL,
  withdrawn_by UUID NOT NULL,
  withdrawal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  withdrawal_reason TEXT,
  negative_stock_reason TEXT,
  used_in_report_id UUID,
  is_archived BOOLEAN DEFAULT FALSE,
  lifecycle_cycle INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: material_withdrawal_collaborators
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.material_withdrawal_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id UUID NOT NULL,
  collaborator_name TEXT NOT NULL,
  is_principal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: conversations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: conversation_participants
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ
);

-- ============================================================================
-- TABELA: chat_groups
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: group_permissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.group_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  can_add_members BOOLEAN DEFAULT FALSE,
  can_remove_members BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- TABELA: messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_global BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: cash_boxes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cash_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_at TIMESTAMPTZ NOT NULL,
  opened_by UUID NOT NULL,
  closed_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  edited_by UUID,
  initial_value NUMERIC NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: cash_box_transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cash_box_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_box_id UUID NOT NULL,
  type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  description TEXT,
  observations TEXT,
  invoice_date DATE,
  attachment_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: patrimonio_historico
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patrimonio_historico (
  historico_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pat_id UUID NOT NULL,
  codigo_pat TEXT NOT NULL,
  tipo_evento TEXT NOT NULL DEFAULT 'ATUALIZAÇÃO',
  detalhes_evento TEXT,
  campo_alterado TEXT,
  valor_antigo TEXT,
  valor_novo TEXT,
  usuario_modificacao UUID,
  usuario_nome TEXT,
  data_modificacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_evento_real TIMESTAMPTZ,
  registro_retroativo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABELA: audit_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  inserted_by_trigger TEXT,
  log_hash TEXT,
  signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: error_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  error_type TEXT NOT NULL,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  page_route TEXT NOT NULL,
  additional_data JSONB,
  webhook_sent BOOLEAN DEFAULT FALSE,
  webhook_sent_at TIMESTAMPTZ,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: receipt_access_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.receipt_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID,
  user_id UUID,
  access_type TEXT NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABELA: system_integrity_resolutions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.system_integrity_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_type TEXT NOT NULL,
  problem_identifier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES RECOMENDADOS (opcional - melhora performance)
-- ============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

-- Assets
CREATE INDEX IF NOT EXISTS idx_assets_asset_code ON public.assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_assets_location_type ON public.assets(location_type);
CREATE INDEX IF NOT EXISTS idx_assets_equipment_name ON public.assets(equipment_name);

-- Material Withdrawals
CREATE INDEX IF NOT EXISTS idx_material_withdrawals_equipment_code ON public.material_withdrawals(equipment_code);
CREATE INDEX IF NOT EXISTS idx_material_withdrawals_is_archived ON public.material_withdrawals(is_archived);

-- Reports
CREATE INDEX IF NOT EXISTS idx_reports_equipment_code ON public.reports(equipment_code);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON public.reports(report_date);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ============================================================================
-- SCRIPT FINALIZADO
-- ============================================================================
-- Total: 39 tabelas criadas
-- Próximo passo: Chamar POST /sync-to-external/full para sincronização inicial
-- ============================================================================
