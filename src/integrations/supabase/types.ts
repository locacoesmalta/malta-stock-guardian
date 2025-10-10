export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      asset_collaborators: {
        Row: {
          asset_id: string
          assignment_date: string
          collaborator_name: string
          created_at: string
          id: string
        }
        Insert: {
          asset_id: string
          assignment_date?: string
          collaborator_name: string
          created_at?: string
          id?: string
        }
        Update: {
          asset_id?: string
          assignment_date?: string
          collaborator_name?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_collaborators_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_mobilization_parts: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          mobilization_asset_id: string | null
          notes: string | null
          product_id: string | null
          purchase_date: string
          quantity: number
          registered_at: string
          registered_by: string
          total_cost: number | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          mobilization_asset_id?: string | null
          notes?: string | null
          product_id?: string | null
          purchase_date: string
          quantity: number
          registered_at?: string
          registered_by: string
          total_cost?: number | null
          unit_cost: number
          updated_at?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          mobilization_asset_id?: string | null
          notes?: string | null
          product_id?: string | null
          purchase_date?: string
          quantity?: number
          registered_at?: string
          registered_by?: string
          total_cost?: number | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_mobilization_parts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_mobilization_parts_mobilization_asset_id_fkey"
            columns: ["mobilization_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_spare_parts: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          registered_at: string
          registered_by: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          registered_at?: string
          registered_by: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          registered_at?: string
          registered_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_spare_parts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_spare_parts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_code: string
          available_for_rental: boolean | null
          comments: string | null
          created_at: string
          created_by: string | null
          deposito_description: string | null
          destination_after_maintenance: string | null
          equipment_condition: string | null
          equipment_name: string
          equipment_observations: string | null
          exploded_drawing_attachment: string | null
          id: string
          inspection_start_date: string | null
          is_new_equipment: boolean | null
          location_type: string
          maintenance_arrival_date: string | null
          maintenance_company: string | null
          maintenance_delay_observations: string | null
          maintenance_departure_date: string | null
          maintenance_description: string | null
          maintenance_work_site: string | null
          malta_collaborator: string | null
          manual_attachment: string | null
          manufacturer: string
          model: string | null
          purchase_date: string | null
          qr_code_data: string | null
          rental_company: string | null
          rental_contract_number: string | null
          rental_end_date: string | null
          rental_photo_1: string | null
          rental_photo_2: string | null
          rental_start_date: string | null
          rental_work_site: string | null
          replaced_by_asset_id: string | null
          replacement_reason: string | null
          returns_to_work_site: boolean | null
          serial_number: string | null
          supplier: string | null
          unit_value: number | null
          updated_at: string
          voltage_combustion: string | null
          was_painted: boolean | null
          was_replaced: boolean | null
          was_washed: boolean | null
        }
        Insert: {
          asset_code: string
          available_for_rental?: boolean | null
          comments?: string | null
          created_at?: string
          created_by?: string | null
          deposito_description?: string | null
          destination_after_maintenance?: string | null
          equipment_condition?: string | null
          equipment_name: string
          equipment_observations?: string | null
          exploded_drawing_attachment?: string | null
          id?: string
          inspection_start_date?: string | null
          is_new_equipment?: boolean | null
          location_type: string
          maintenance_arrival_date?: string | null
          maintenance_company?: string | null
          maintenance_delay_observations?: string | null
          maintenance_departure_date?: string | null
          maintenance_description?: string | null
          maintenance_work_site?: string | null
          malta_collaborator?: string | null
          manual_attachment?: string | null
          manufacturer: string
          model?: string | null
          purchase_date?: string | null
          qr_code_data?: string | null
          rental_company?: string | null
          rental_contract_number?: string | null
          rental_end_date?: string | null
          rental_photo_1?: string | null
          rental_photo_2?: string | null
          rental_start_date?: string | null
          rental_work_site?: string | null
          replaced_by_asset_id?: string | null
          replacement_reason?: string | null
          returns_to_work_site?: boolean | null
          serial_number?: string | null
          supplier?: string | null
          unit_value?: number | null
          updated_at?: string
          voltage_combustion?: string | null
          was_painted?: boolean | null
          was_replaced?: boolean | null
          was_washed?: boolean | null
        }
        Update: {
          asset_code?: string
          available_for_rental?: boolean | null
          comments?: string | null
          created_at?: string
          created_by?: string | null
          deposito_description?: string | null
          destination_after_maintenance?: string | null
          equipment_condition?: string | null
          equipment_name?: string
          equipment_observations?: string | null
          exploded_drawing_attachment?: string | null
          id?: string
          inspection_start_date?: string | null
          is_new_equipment?: boolean | null
          location_type?: string
          maintenance_arrival_date?: string | null
          maintenance_company?: string | null
          maintenance_delay_observations?: string | null
          maintenance_departure_date?: string | null
          maintenance_description?: string | null
          maintenance_work_site?: string | null
          malta_collaborator?: string | null
          manual_attachment?: string | null
          manufacturer?: string
          model?: string | null
          purchase_date?: string | null
          qr_code_data?: string | null
          rental_company?: string | null
          rental_contract_number?: string | null
          rental_end_date?: string | null
          rental_photo_1?: string | null
          rental_photo_2?: string | null
          rental_start_date?: string | null
          rental_work_site?: string | null
          replaced_by_asset_id?: string | null
          replacement_reason?: string | null
          returns_to_work_site?: boolean | null
          serial_number?: string | null
          supplier?: string | null
          unit_value?: number | null
          updated_at?: string
          voltage_combustion?: string | null
          was_painted?: boolean | null
          was_replaced?: boolean | null
          was_washed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_replaced_by_asset_id_fkey"
            columns: ["replaced_by_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          inserted_by_trigger: string | null
          ip_address: string | null
          log_hash: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          inserted_by_trigger?: string | null
          ip_address?: string | null
          log_hash?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          inserted_by_trigger?: string | null
          ip_address?: string | null
          log_hash?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      cash_box_transactions: {
        Row: {
          attachment_url: string | null
          cash_box_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          observations: string | null
          type: string
          updated_at: string
          value: number
        }
        Insert: {
          attachment_url?: string | null
          cash_box_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          observations?: string | null
          type: string
          updated_at?: string
          value: number
        }
        Update: {
          attachment_url?: string | null
          cash_box_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          observations?: string | null
          type?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_box_transactions_cash_box_id_fkey"
            columns: ["cash_box_id"]
            isOneToOne: false
            referencedRelation: "cash_boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_boxes: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          initial_value: number
          opened_at: string
          opened_by: string
          status: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          initial_value: number
          opened_at: string
          opened_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          initial_value?: number
          opened_at?: string
          opened_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_withdrawals: {
        Row: {
          company: string
          created_at: string
          equipment_code: string
          id: string
          product_id: string
          quantity: number
          withdrawal_date: string
          withdrawal_reason: string | null
          withdrawn_by: string
          work_site: string
        }
        Insert: {
          company: string
          created_at?: string
          equipment_code: string
          id?: string
          product_id: string
          quantity: number
          withdrawal_date?: string
          withdrawal_reason?: string | null
          withdrawn_by: string
          work_site: string
        }
        Update: {
          company?: string
          created_at?: string
          equipment_code?: string
          id?: string
          product_id?: string
          quantity?: number
          withdrawal_date?: string
          withdrawal_reason?: string | null
          withdrawn_by?: string
          work_site?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_withdrawals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      patrimonio_historico: {
        Row: {
          campo_alterado: string | null
          codigo_pat: string
          created_at: string
          data_modificacao: string
          detalhes_evento: string | null
          historico_id: string
          pat_id: string
          tipo_evento: string
          usuario_modificacao: string | null
          usuario_nome: string | null
          valor_antigo: string | null
          valor_novo: string | null
        }
        Insert: {
          campo_alterado?: string | null
          codigo_pat: string
          created_at?: string
          data_modificacao?: string
          detalhes_evento?: string | null
          historico_id?: string
          pat_id: string
          tipo_evento?: string
          usuario_modificacao?: string | null
          usuario_nome?: string | null
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo_alterado?: string | null
          codigo_pat?: string
          created_at?: string
          data_modificacao?: string
          detalhes_evento?: string | null
          historico_id?: string
          pat_id?: string
          tipo_evento?: string
          usuario_modificacao?: string | null
          usuario_nome?: string | null
          valor_antigo?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patrimonio_historico_pat_id_fkey"
            columns: ["pat_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      product_purchases: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          operator_id: string | null
          operator_name: string | null
          payment_type: string
          product_id: string
          purchase_date: string
          purchase_price: number | null
          quantity: number
          sale_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          operator_id?: string | null
          operator_name?: string | null
          payment_type: string
          product_id: string
          purchase_date: string
          purchase_price?: number | null
          quantity: number
          sale_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          operator_id?: string | null
          operator_name?: string | null
          payment_type?: string
          product_id?: string
          purchase_date?: string
          purchase_price?: number | null
          quantity?: number
          sale_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          code: string
          comments: string | null
          created_at: string
          created_by: string | null
          id: string
          last_purchase_date: string | null
          manufacturer: string | null
          min_quantity: number
          name: string
          payment_type: string | null
          purchase_price: number | null
          quantity: number
          sale_price: number | null
          updated_at: string
        }
        Insert: {
          code: string
          comments?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_purchase_date?: string | null
          manufacturer?: string | null
          min_quantity?: number
          name: string
          payment_type?: string | null
          purchase_price?: number | null
          quantity?: number
          sale_price?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          comments?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_purchase_date?: string | null
          manufacturer?: string | null
          min_quantity?: number
          name?: string
          payment_type?: string | null
          purchase_price?: number | null
          quantity?: number
          sale_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rental_companies: {
        Row: {
          address: string | null
          cnpj: string
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          contract_end_date: string
          contract_number: string
          contract_start_date: string
          contract_type: string
          created_at: string
          created_by: string | null
          daily_rental_price: number | null
          documents: Json | null
          equipment_description: string | null
          id: string
          is_renewed: boolean | null
          notes: string | null
          rental_end_date: string | null
          rental_start_date: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj: string
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          contract_end_date: string
          contract_number: string
          contract_start_date: string
          contract_type: string
          created_at?: string
          created_by?: string | null
          daily_rental_price?: number | null
          documents?: Json | null
          equipment_description?: string | null
          id?: string
          is_renewed?: boolean | null
          notes?: string | null
          rental_end_date?: string | null
          rental_start_date?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          contract_end_date?: string
          contract_number?: string
          contract_start_date?: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          daily_rental_price?: number | null
          documents?: Json | null
          equipment_description?: string | null
          id?: string
          is_renewed?: boolean | null
          notes?: string | null
          rental_end_date?: string | null
          rental_start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      report_parts: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity_used: number
          report_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity_used?: number
          report_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity_used?: number
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_parts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_parts_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_photos: {
        Row: {
          created_at: string
          id: string
          photo_comment: string
          photo_order: number
          photo_url: string
          report_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_comment: string
          photo_order: number
          photo_url: string
          report_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_comment?: string
          photo_order?: number
          photo_url?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_photos_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          company: string
          considerations: string | null
          created_at: string
          created_by: string
          equipment_code: string
          equipment_name: string | null
          id: string
          observations: string | null
          receiver: string | null
          report_date: string
          responsible: string | null
          service_comments: string
          technician_name: string
          updated_at: string
          work_site: string
        }
        Insert: {
          company: string
          considerations?: string | null
          created_at?: string
          created_by: string
          equipment_code?: string
          equipment_name?: string | null
          id?: string
          observations?: string | null
          receiver?: string | null
          report_date?: string
          responsible?: string | null
          service_comments: string
          technician_name: string
          updated_at?: string
          work_site: string
        }
        Update: {
          company?: string
          considerations?: string | null
          created_at?: string
          created_by?: string
          equipment_code?: string
          equipment_name?: string | null
          id?: string
          observations?: string | null
          receiver?: string | null
          report_date?: string
          responsible?: string | null
          service_comments?: string
          technician_name?: string
          updated_at?: string
          work_site?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_access_admin: boolean | null
          can_access_assets: boolean | null
          can_access_main_menu: boolean | null
          can_create_assets: boolean | null
          can_create_reports: boolean | null
          can_create_withdrawals: boolean | null
          can_delete_assets: boolean | null
          can_delete_products: boolean | null
          can_delete_reports: boolean | null
          can_edit_assets: boolean | null
          can_edit_products: boolean | null
          can_edit_reports: boolean | null
          can_scan_assets: boolean | null
          can_view_products: boolean | null
          can_view_reports: boolean | null
          can_view_withdrawal_history: boolean | null
          created_at: string
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_access_admin?: boolean | null
          can_access_assets?: boolean | null
          can_access_main_menu?: boolean | null
          can_create_assets?: boolean | null
          can_create_reports?: boolean | null
          can_create_withdrawals?: boolean | null
          can_delete_assets?: boolean | null
          can_delete_products?: boolean | null
          can_delete_reports?: boolean | null
          can_edit_assets?: boolean | null
          can_edit_products?: boolean | null
          can_edit_reports?: boolean | null
          can_scan_assets?: boolean | null
          can_view_products?: boolean | null
          can_view_reports?: boolean | null
          can_view_withdrawal_history?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_access_admin?: boolean | null
          can_access_assets?: boolean | null
          can_access_main_menu?: boolean | null
          can_create_assets?: boolean | null
          can_create_reports?: boolean | null
          can_create_withdrawals?: boolean | null
          can_delete_assets?: boolean | null
          can_delete_products?: boolean | null
          can_delete_reports?: boolean | null
          can_edit_assets?: boolean | null
          can_edit_products?: boolean | null
          can_edit_reports?: boolean | null
          can_scan_assets?: boolean | null
          can_view_products?: boolean | null
          can_view_reports?: boolean | null
          can_view_withdrawal_history?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_user_access_assets: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_create_assets: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_create_reports: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_create_withdrawals: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_delete_assets: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_delete_products: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_delete_reports: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_edit_assets: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_edit_products: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_edit_reports: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_view_products: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_view_reports: {
        Args: { _user_id: string }
        Returns: boolean
      }
      check_audit_logs_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          integrity_issues: number
          logs_without_hash: number
          logs_without_trigger_info: number
          recent_logs_count: number
          total_logs: number
        }[]
      }
      generate_audit_log_hash: {
        Args: {
          p_action: string
          p_record_id: string
          p_table_name: string
          p_timestamp: string
          p_user_id: string
        }
        Returns: string
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_user_active: {
        Args: { _user_id: string }
        Returns: boolean
      }
      registrar_evento_patrimonio: {
        Args: {
          p_campo_alterado?: string
          p_codigo_pat: string
          p_detalhes_evento: string
          p_pat_id: string
          p_tipo_evento: string
          p_valor_antigo?: string
          p_valor_novo?: string
        }
        Returns: string
      }
      verify_audit_log_integrity: {
        Args: { p_log_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
