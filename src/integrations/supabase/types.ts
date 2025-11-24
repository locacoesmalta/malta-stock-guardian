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
      asset_lifecycle_history: {
        Row: {
          archived_withdrawals_count: number | null
          asset_code: string
          asset_id: string | null
          closed_by: string | null
          created_at: string | null
          cycle_closed_at: string | null
          cycle_number: number
          cycle_started_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          archived_withdrawals_count?: number | null
          asset_code: string
          asset_id?: string | null
          closed_by?: string | null
          created_at?: string | null
          cycle_closed_at?: string | null
          cycle_number: number
          cycle_started_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          archived_withdrawals_count?: number | null
          asset_code?: string
          asset_id?: string | null
          closed_by?: string | null
          created_at?: string | null
          cycle_closed_at?: string | null
          cycle_number?: number
          cycle_started_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_lifecycle_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_maintenance_parts: {
        Row: {
          created_at: string
          id: string
          maintenance_id: string
          product_id: string
          quantity: number
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          maintenance_id: string
          product_id: string
          quantity?: number
          total_cost?: number | null
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          maintenance_id?: string
          product_id?: string
          quantity?: number
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_parts_maintenance_id_fkey"
            columns: ["maintenance_id"]
            isOneToOne: false
            referencedRelation: "asset_maintenances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_maintenance_parts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_maintenances: {
        Row: {
          asset_id: string
          created_at: string
          current_hourmeter: number
          effective_maintenance_date: string | null
          id: string
          labor_cost: number | null
          maintenance_date: string
          maintenance_type: string
          observations: string | null
          parts_cost: number | null
          previous_hourmeter: number
          registered_by: string
          services_performed: string
          technician_name: string | null
          total_cost: number | null
          total_hourmeter: number | null
          updated_at: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          current_hourmeter?: number
          effective_maintenance_date?: string | null
          id?: string
          labor_cost?: number | null
          maintenance_date?: string
          maintenance_type: string
          observations?: string | null
          parts_cost?: number | null
          previous_hourmeter?: number
          registered_by: string
          services_performed: string
          technician_name?: string | null
          total_cost?: number | null
          total_hourmeter?: number | null
          updated_at?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          current_hourmeter?: number
          effective_maintenance_date?: string | null
          id?: string
          labor_cost?: number | null
          maintenance_date?: string
          maintenance_type?: string
          observations?: string | null
          parts_cost?: number | null
          previous_hourmeter?: number
          registered_by?: string
          services_performed?: string
          technician_name?: string | null
          total_cost?: number | null
          total_hourmeter?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenances_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_mobilization_expenses: {
        Row: {
          asset_id: string
          collaborator_name: string | null
          created_at: string
          expense_type: string
          id: string
          received_by: string | null
          registered_by: string
          return_date: string | null
          sent_by: string | null
          shipment_date: string | null
          travel_date: string | null
          updated_at: string
          value: number
        }
        Insert: {
          asset_id: string
          collaborator_name?: string | null
          created_at?: string
          expense_type: string
          id?: string
          received_by?: string | null
          registered_by: string
          return_date?: string | null
          sent_by?: string | null
          shipment_date?: string | null
          travel_date?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          asset_id?: string
          collaborator_name?: string | null
          created_at?: string
          expense_type?: string
          id?: string
          received_by?: string | null
          registered_by?: string
          return_date?: string | null
          sent_by?: string | null
          shipment_date?: string | null
          travel_date?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_mobilization_expenses_asset_id_fkey"
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
          deleted_at: string | null
          deposito_description: string | null
          destination_after_maintenance: string | null
          effective_registration_date: string | null
          equipment_condition: string | null
          equipment_name: string
          equipment_observations: string | null
          exploded_drawing_attachment: string | null
          id: string
          inspection_start_date: string | null
          is_new_equipment: boolean | null
          location_type: string
          locked_for_manual_edit: boolean | null
          maintenance_arrival_date: string | null
          maintenance_company: string | null
          maintenance_delay_observations: string | null
          maintenance_departure_date: string | null
          maintenance_description: string | null
          maintenance_interval: number | null
          maintenance_status: string | null
          maintenance_work_site: string | null
          malta_collaborator: string | null
          manual_attachment: string | null
          manufacturer: string
          model: string | null
          next_maintenance_hourmeter: number | null
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
          retroactive_justification: string | null
          retroactive_registration_notes: string | null
          returns_to_work_site: boolean | null
          serial_number: string | null
          substitution_date: string | null
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
          deleted_at?: string | null
          deposito_description?: string | null
          destination_after_maintenance?: string | null
          effective_registration_date?: string | null
          equipment_condition?: string | null
          equipment_name: string
          equipment_observations?: string | null
          exploded_drawing_attachment?: string | null
          id?: string
          inspection_start_date?: string | null
          is_new_equipment?: boolean | null
          location_type: string
          locked_for_manual_edit?: boolean | null
          maintenance_arrival_date?: string | null
          maintenance_company?: string | null
          maintenance_delay_observations?: string | null
          maintenance_departure_date?: string | null
          maintenance_description?: string | null
          maintenance_interval?: number | null
          maintenance_status?: string | null
          maintenance_work_site?: string | null
          malta_collaborator?: string | null
          manual_attachment?: string | null
          manufacturer: string
          model?: string | null
          next_maintenance_hourmeter?: number | null
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
          retroactive_justification?: string | null
          retroactive_registration_notes?: string | null
          returns_to_work_site?: boolean | null
          serial_number?: string | null
          substitution_date?: string | null
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
          deleted_at?: string | null
          deposito_description?: string | null
          destination_after_maintenance?: string | null
          effective_registration_date?: string | null
          equipment_condition?: string | null
          equipment_name?: string
          equipment_observations?: string | null
          exploded_drawing_attachment?: string | null
          id?: string
          inspection_start_date?: string | null
          is_new_equipment?: boolean | null
          location_type?: string
          locked_for_manual_edit?: boolean | null
          maintenance_arrival_date?: string | null
          maintenance_company?: string | null
          maintenance_delay_observations?: string | null
          maintenance_departure_date?: string | null
          maintenance_description?: string | null
          maintenance_interval?: number | null
          maintenance_status?: string | null
          maintenance_work_site?: string | null
          malta_collaborator?: string | null
          manual_attachment?: string | null
          manufacturer?: string
          model?: string | null
          next_maintenance_hourmeter?: number | null
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
          retroactive_justification?: string | null
          retroactive_registration_notes?: string | null
          returns_to_work_site?: boolean | null
          serial_number?: string | null
          substitution_date?: string | null
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
          signature: string | null
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
          signature?: string | null
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
          signature?: string | null
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
          invoice_date: string | null
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
          invoice_date?: string | null
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
          invoice_date?: string | null
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
          edited_at: string | null
          edited_by: string | null
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
          edited_at?: string | null
          edited_by?: string | null
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
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          initial_value?: number
          opened_at?: string
          opened_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_groups: {
        Row: {
          avatar_url: string | null
          conversation_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          conversation_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          avatar_url?: string | null
          conversation_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_groups_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipment_receipt_items: {
        Row: {
          created_at: string
          id: string
          item_order: number
          pat_code: string | null
          photos: Json | null
          quantity: number
          receipt_id: string
          specification: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_order: number
          pat_code?: string | null
          photos?: Json | null
          quantity: number
          receipt_id: string
          specification: string
        }
        Update: {
          created_at?: string
          id?: string
          item_order?: number
          pat_code?: string | null
          photos?: Json | null
          quantity?: number
          receipt_id?: string
          specification?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "equipment_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_receipts: {
        Row: {
          asset_id: string | null
          client_name: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          digital_signature: Json | null
          id: string
          malta_operator: string | null
          operation_nature: string | null
          pdf_url: string | null
          receipt_date: string
          receipt_number: number
          receipt_type: string
          received_by: string
          received_by_cpf: string | null
          received_by_cpf_encrypted: string | null
          received_by_malta: string | null
          signature: string | null
          updated_at: string
          whatsapp: string | null
          work_site: string
        }
        Insert: {
          asset_id?: string | null
          client_name: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          digital_signature?: Json | null
          id?: string
          malta_operator?: string | null
          operation_nature?: string | null
          pdf_url?: string | null
          receipt_date: string
          receipt_number: number
          receipt_type: string
          received_by: string
          received_by_cpf?: string | null
          received_by_cpf_encrypted?: string | null
          received_by_malta?: string | null
          signature?: string | null
          updated_at?: string
          whatsapp?: string | null
          work_site: string
        }
        Update: {
          asset_id?: string | null
          client_name?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          digital_signature?: Json | null
          id?: string
          malta_operator?: string | null
          operation_nature?: string | null
          pdf_url?: string | null
          receipt_date?: string
          receipt_number?: number
          receipt_type?: string
          received_by?: string
          received_by_cpf?: string | null
          received_by_cpf_encrypted?: string | null
          received_by_malta?: string | null
          signature?: string | null
          updated_at?: string
          whatsapp?: string | null
          work_site?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_receipts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_rental_catalog: {
        Row: {
          category: string | null
          created_at: string | null
          daily_rate_15: number | null
          daily_rate_30: number | null
          id: string
          is_active: boolean | null
          name: string
          price_15_days: number | null
          price_30_days: number | null
          special_rules: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          daily_rate_15?: number | null
          daily_rate_30?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price_15_days?: number | null
          price_30_days?: number | null
          special_rules?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          daily_rate_15?: number | null
          daily_rate_30?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_15_days?: number | null
          price_30_days?: number | null
          special_rules?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          additional_data: Json | null
          created_at: string
          error_code: string
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          page_route: string
          timestamp: string
          user_email: string | null
          user_id: string | null
          user_name: string | null
          webhook_sent: boolean | null
          webhook_sent_at: string | null
        }
        Insert: {
          additional_data?: Json | null
          created_at?: string
          error_code: string
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          page_route: string
          timestamp?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          webhook_sent?: boolean | null
          webhook_sent_at?: string | null
        }
        Update: {
          additional_data?: Json | null
          created_at?: string
          error_code?: string
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          page_route?: string
          timestamp?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          webhook_sent?: boolean | null
          webhook_sent_at?: string | null
        }
        Relationships: []
      }
      group_permissions: {
        Row: {
          can_add_members: boolean | null
          can_remove_members: boolean | null
          group_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          can_add_members?: boolean | null
          can_remove_members?: boolean | null
          group_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          can_add_members?: boolean | null
          can_remove_members?: boolean | null
          group_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      material_withdrawal_collaborators: {
        Row: {
          collaborator_name: string
          created_at: string
          id: string
          is_principal: boolean
          withdrawal_id: string
        }
        Insert: {
          collaborator_name: string
          created_at?: string
          id?: string
          is_principal?: boolean
          withdrawal_id: string
        }
        Update: {
          collaborator_name?: string
          created_at?: string
          id?: string
          is_principal?: boolean
          withdrawal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_withdrawal_collaborators_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "material_withdrawals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_withdrawal_collaborators_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "v_withdrawals_with_remaining"
            referencedColumns: ["id"]
          },
        ]
      }
      material_withdrawals: {
        Row: {
          company: string
          created_at: string
          equipment_code: string
          id: string
          is_archived: boolean | null
          lifecycle_cycle: number | null
          negative_stock_reason: string | null
          product_id: string
          quantity: number
          used_in_report_id: string | null
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
          is_archived?: boolean | null
          lifecycle_cycle?: number | null
          negative_stock_reason?: string | null
          product_id: string
          quantity: number
          used_in_report_id?: string | null
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
          is_archived?: boolean | null
          lifecycle_cycle?: number | null
          negative_stock_reason?: string | null
          product_id?: string
          quantity?: number
          used_in_report_id?: string | null
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
          {
            foreignKeyName: "material_withdrawals_used_in_report_id_fkey"
            columns: ["used_in_report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          is_global: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_global?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_global?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      patrimonio_historico: {
        Row: {
          campo_alterado: string | null
          codigo_pat: string
          created_at: string
          data_evento_real: string | null
          data_modificacao: string
          detalhes_evento: string | null
          historico_id: string
          pat_id: string
          registro_retroativo: boolean | null
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
          data_evento_real?: string | null
          data_modificacao?: string
          detalhes_evento?: string | null
          historico_id?: string
          pat_id: string
          registro_retroativo?: boolean | null
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
          data_evento_real?: string | null
          data_modificacao?: string
          detalhes_evento?: string | null
          historico_id?: string
          pat_id?: string
          registro_retroativo?: boolean | null
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
      product_stock_adjustments: {
        Row: {
          adjusted_by: string
          adjustment_date: string
          created_at: string
          id: string
          new_quantity: number
          notes: string | null
          previous_quantity: number
          product_id: string
          quantity_change: number
          reason: string | null
        }
        Insert: {
          adjusted_by: string
          adjustment_date?: string
          created_at?: string
          id?: string
          new_quantity: number
          notes?: string | null
          previous_quantity: number
          product_id: string
          quantity_change: number
          reason?: string | null
        }
        Update: {
          adjusted_by?: string
          adjustment_date?: string
          created_at?: string
          id?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          product_id?: string
          quantity_change?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_stock_adjustments_product_id_fkey"
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
          deleted_at: string | null
          equipment_brand: string | null
          equipment_model: string | null
          equipment_type: string | null
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
          deleted_at?: string | null
          equipment_brand?: string | null
          equipment_model?: string | null
          equipment_type?: string | null
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
          deleted_at?: string | null
          equipment_brand?: string | null
          equipment_model?: string | null
          equipment_type?: string | null
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
          last_login_at: string | null
          last_login_ip: string | null
          login_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          last_login_at?: string | null
          last_login_ip?: string | null
          login_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          last_login_ip?: string | null
          login_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      receipt_access_logs: {
        Row: {
          access_type: string
          accessed_at: string | null
          id: string
          receipt_id: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          id?: string
          receipt_id?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          id?: string
          receipt_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_access_logs_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "equipment_receipts"
            referencedColumns: ["id"]
          },
        ]
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
      rental_equipment: {
        Row: {
          asset_code: string
          asset_id: string | null
          created_at: string
          daily_rate: number | null
          equipment_name: string
          id: string
          pickup_date: string
          rental_company_id: string
          return_date: string | null
          updated_at: string
          work_site: string | null
        }
        Insert: {
          asset_code: string
          asset_id?: string | null
          created_at?: string
          daily_rate?: number | null
          equipment_name: string
          id?: string
          pickup_date: string
          rental_company_id: string
          return_date?: string | null
          updated_at?: string
          work_site?: string | null
        }
        Update: {
          asset_code?: string
          asset_id?: string | null
          created_at?: string
          daily_rate?: number | null
          equipment_name?: string
          id?: string
          pickup_date?: string
          rental_company_id?: string
          return_date?: string | null
          updated_at?: string
          work_site?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_equipment_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_equipment_rental_company_id_fkey"
            columns: ["rental_company_id"]
            isOneToOne: false
            referencedRelation: "rental_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      report_external_services: {
        Row: {
          created_at: string
          created_by: string
          id: string
          report_id: string
          service_description: string
          service_value: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          report_id: string
          service_description: string
          service_value: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          report_id?: string
          service_description?: string
          service_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_external_services_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_parts: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity_used: number
          report_id: string
          withdrawal_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity_used?: number
          report_id: string
          withdrawal_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity_used?: number
          report_id?: string
          withdrawal_id?: string | null
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
          {
            foreignKeyName: "report_parts_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "material_withdrawals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_parts_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "v_withdrawals_with_remaining"
            referencedColumns: ["id"]
          },
        ]
      }
      report_photos: {
        Row: {
          created_at: string
          flip_horizontal: boolean | null
          flip_vertical: boolean | null
          id: string
          original_height: number | null
          original_size_bytes: number | null
          original_width: number | null
          photo_comment: string
          photo_order: number
          photo_url: string
          processed_height: number | null
          processed_size_bytes: number | null
          processed_width: number | null
          processing_applied: boolean | null
          report_id: string
          rotation_applied: number | null
        }
        Insert: {
          created_at?: string
          flip_horizontal?: boolean | null
          flip_vertical?: boolean | null
          id?: string
          original_height?: number | null
          original_size_bytes?: number | null
          original_width?: number | null
          photo_comment: string
          photo_order: number
          photo_url: string
          processed_height?: number | null
          processed_size_bytes?: number | null
          processed_width?: number | null
          processing_applied?: boolean | null
          report_id: string
          rotation_applied?: number | null
        }
        Update: {
          created_at?: string
          flip_horizontal?: boolean | null
          flip_vertical?: boolean | null
          id?: string
          original_height?: number | null
          original_size_bytes?: number | null
          original_width?: number | null
          photo_comment?: string
          photo_order?: number
          photo_url?: string
          processed_height?: number | null
          processed_size_bytes?: number | null
          processed_width?: number | null
          processing_applied?: boolean | null
          report_id?: string
          rotation_applied?: number | null
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      system_integrity_resolutions: {
        Row: {
          created_at: string | null
          id: string
          priority: string | null
          problem_identifier: string
          problem_type: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          priority?: string | null
          problem_identifier: string
          problem_type: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          priority?: string | null
          problem_identifier?: string
          problem_type?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
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
          can_view_financial_data: boolean | null
          can_view_products: boolean | null
          can_view_reports: boolean | null
          can_view_withdrawal_history: boolean | null
          created_at: string
          id: string
          is_active: boolean | null
          must_change_password: boolean | null
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
          can_view_financial_data?: boolean | null
          can_view_products?: boolean | null
          can_view_reports?: boolean | null
          can_view_withdrawal_history?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          must_change_password?: boolean | null
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
          can_view_financial_data?: boolean | null
          can_view_products?: boolean | null
          can_view_reports?: boolean | null
          can_view_withdrawal_history?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          must_change_password?: boolean | null
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
      user_presence: {
        Row: {
          browser_info: Json | null
          created_at: string
          current_route: string | null
          id: string
          is_online: boolean
          last_activity: string
          session_id: string
          updated_at: string
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          browser_info?: Json | null
          created_at?: string
          current_route?: string | null
          id?: string
          is_online?: boolean
          last_activity?: string
          session_id: string
          updated_at?: string
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          browser_info?: Json | null
          created_at?: string
          current_route?: string | null
          id?: string
          is_online?: boolean
          last_activity?: string
          session_id?: string
          updated_at?: string
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
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
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      audit_logs_integrity_status: {
        Row: {
          action: string | null
          created_at: string | null
          has_signature: boolean | null
          id: string | null
          integrity_status: string | null
          table_name: string | null
          user_email: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          has_signature?: never
          id?: string | null
          integrity_status?: never
          table_name?: string | null
          user_email?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          has_signature?: never
          id?: string | null
          integrity_status?: never
          table_name?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      v_asset_movement_inconsistencies: {
        Row: {
          asset_code: string | null
          days_difference: number | null
          equipment_name: string | null
          inconsistency_type: string | null
          registration_date: string | null
          substitution_date: string | null
        }
        Relationships: []
      }
      v_duplicate_equipment_names: {
        Row: {
          equipamento_normalizado: string | null
          exemplos_pat: string[] | null
          qtd_variacoes: number | null
          total_registros: number | null
          variacoes: string[] | null
        }
        Relationships: []
      }
      v_duplicate_equipment_types: {
        Row: {
          exemplos_codigo: string[] | null
          qtd_variacoes: number | null
          tipo_normalizado: string | null
          total_produtos: number | null
          variacoes: string[] | null
        }
        Relationships: []
      }
      v_duplicate_manufacturers_assets: {
        Row: {
          exemplos_pat: string[] | null
          fabricante_normalizado: string | null
          qtd_variacoes: number | null
          total_equipamentos: number | null
          variacoes: string[] | null
        }
        Relationships: []
      }
      v_duplicate_manufacturers_products: {
        Row: {
          exemplos_codigo: string[] | null
          fabricante_normalizado: string | null
          qtd_variacoes: number | null
          total_produtos: number | null
          variacoes: string[] | null
        }
        Relationships: []
      }
      v_duplicate_models: {
        Row: {
          exemplos_pat: string[] | null
          modelo_normalizado: string | null
          qtd_variacoes: number | null
          total_equipamentos: number | null
          variacoes: string[] | null
        }
        Relationships: []
      }
      v_duplicate_products: {
        Row: {
          exemplos_codigo: string[] | null
          produto_normalizado: string | null
          qtd_variacoes: number | null
          total_produtos: number | null
          variacoes: string[] | null
        }
        Relationships: []
      }
      v_withdrawals_with_remaining: {
        Row: {
          company: string | null
          created_at: string | null
          equipment_code: string | null
          id: string | null
          is_archived: boolean | null
          lifecycle_cycle: number | null
          product_id: string | null
          quantity: number | null
          remaining_quantity: number | null
          used_in_report_id: string | null
          withdrawal_date: string | null
          withdrawal_reason: string | null
          withdrawn_by: string | null
          work_site: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_withdrawals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_withdrawals_used_in_report_id_fkey"
            columns: ["used_in_report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      audit_security_definer_views: {
        Args: never
        Returns: {
          recommendation: string
          security_level: string
          view_name: string
          view_owner: string
        }[]
      }
      can_user_access_assets: { Args: { _user_id: string }; Returns: boolean }
      can_user_create_assets: { Args: { _user_id: string }; Returns: boolean }
      can_user_create_reports: { Args: { _user_id: string }; Returns: boolean }
      can_user_create_withdrawals: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_delete_assets: { Args: { _user_id: string }; Returns: boolean }
      can_user_delete_products: { Args: { _user_id: string }; Returns: boolean }
      can_user_delete_reports: { Args: { _user_id: string }; Returns: boolean }
      can_user_edit_assets: { Args: { _user_id: string }; Returns: boolean }
      can_user_edit_products: { Args: { _user_id: string }; Returns: boolean }
      can_user_edit_reports: { Args: { _user_id: string }; Returns: boolean }
      can_user_view_financial_data: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_view_products: { Args: { _user_id: string }; Returns: boolean }
      can_user_view_reports: { Args: { _user_id: string }; Returns: boolean }
      check_assets_integrity: {
        Args: never
        Returns: {
          asset_code: string
          asset_id: string
          details: string
          issue_type: string
        }[]
      }
      check_audit_logs_health: {
        Args: never
        Returns: {
          integrity_issues: number
          logs_without_hash: number
          logs_without_trigger_info: number
          recent_logs_count: number
          total_logs: number
        }[]
      }
      check_audit_logs_integrity: {
        Args: never
        Returns: {
          action: string
          created_at: string
          issue_type: string
          log_id: string
          table_name: string
          user_email: string
        }[]
      }
      check_products_integrity: {
        Args: never
        Returns: {
          current_quantity: number
          has_adjustment_history: boolean
          issue_type: string
          product_code: string
          product_id: string
          product_name: string
        }[]
      }
      check_products_orphan_references: {
        Args: never
        Returns: {
          details: string
          issue_type: string
          product_code: string
          product_name: string
          reference_id: string
          reference_type: string
        }[]
      }
      check_products_stock_integrity: {
        Args: never
        Returns: {
          current_quantity: number
          issue_type: string
          product_code: string
          product_id: string
          product_name: string
        }[]
      }
      check_reports_integrity: {
        Args: never
        Returns: {
          equipment_code: string
          issue_type: string
          report_date: string
          report_id: string
        }[]
      }
      check_sessions_integrity: {
        Args: never
        Returns: {
          is_online: boolean
          issue_type: string
          last_activity: string
          session_count: number
          session_id: string
          user_email: string
          user_name: string
        }[]
      }
      check_withdrawals_integrity: {
        Args: never
        Returns: {
          details: string
          equipment_code: string
          issue_type: string
          product_code: string
          product_name: string
          quantity: number
          withdrawal_date: string
          withdrawal_id: string
        }[]
      }
      cleanup_inactive_sessions: { Args: never; Returns: undefined }
      cleanup_old_presence: { Args: never; Returns: undefined }
      create_report_with_parts:
        | {
            Args: {
              p_company: string
              p_considerations?: string
              p_created_by?: string
              p_equipment_code: string
              p_equipment_name: string
              p_observations?: string
              p_parts?: Json
              p_receiver?: string
              p_report_date: string
              p_responsible?: string
              p_service_comments: string
              p_technician_name: string
              p_work_site: string
            }
            Returns: string
          }
        | {
            Args: {
              p_company: string
              p_considerations?: string
              p_created_by?: string
              p_equipment_code: string
              p_equipment_name: string
              p_external_services?: Json
              p_observations?: string
              p_parts?: Json
              p_receiver?: string
              p_report_date: string
              p_responsible?: string
              p_service_comments: string
              p_technician_name: string
              p_work_site: string
            }
            Returns: string
          }
      fix_duplicate_equipment_names: {
        Args: { p_correct_name: string; p_variations: string[] }
        Returns: number
      }
      fix_duplicate_equipment_types: {
        Args: { p_correct_name: string; p_variations: string[] }
        Returns: number
      }
      fix_duplicate_manufacturers_assets: {
        Args: { p_correct_name: string; p_variations: string[] }
        Returns: number
      }
      fix_duplicate_manufacturers_products: {
        Args: { p_correct_name: string; p_variations: string[] }
        Returns: number
      }
      fix_duplicate_models: {
        Args: { p_correct_name: string; p_variations: string[] }
        Returns: number
      }
      fix_duplicate_product_names: {
        Args: { p_correct_name: string; p_variations: string[] }
        Returns: number
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
      get_asset_last_context: {
        Args: { p_equipment_code: string }
        Returns: {
          last_company: string
          last_technician: string
          last_work_site: string
          pending_parts_count: number
          top_products: Json
        }[]
      }
      get_assets_missing_manufacturer: {
        Args: never
        Returns: {
          asset_code: string
          created_at: string
          equipment_name: string
          id: string
          location_type: string
        }[]
      }
      get_collaborator_details: {
        Args: {
          p_collaborator_name: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          all_collaborators: string[]
          asset_code: string
          days_in_maintenance: number
          equipment_name: string
          id: string
          maintenance_arrival_date: string
          maintenance_company: string
          maintenance_delay_observations: string
          maintenance_departure_date: string
          maintenance_work_site: string
          service_type: string
        }[]
      }
      get_compatible_products: {
        Args: {
          p_equipment_brand: string
          p_equipment_model: string
          p_equipment_type: string
        }
        Returns: {
          code: string
          compatibility_level: string
          id: string
          is_universal: boolean
          manufacturer: string
          min_quantity: number
          name: string
          purchase_price: number
          quantity: number
          sale_price: number
        }[]
      }
      get_monthly_productivity: {
        Args: { p_month: number; p_year: number }
        Returns: {
          collaborator_name: string
          equipment_count: number
        }[]
      }
      get_session_health_stats: { Args: never; Returns: Json }
      get_total_hourmeter: { Args: { p_asset_id: string }; Returns: number }
      get_user_welcome_data: { Args: { p_user_id: string }; Returns: Json }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_or_superuser: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_programmatic_operation: { Args: never; Returns: boolean }
      is_superuser: { Args: { _user_id: string }; Returns: boolean }
      is_system_owner: { Args: { _user_id: string }; Returns: boolean }
      is_user_active: { Args: { _user_id: string }; Returns: boolean }
      mark_integrity_problem_ignored: {
        Args: {
          p_notes?: string
          p_problem_identifier: string
          p_problem_type: string
        }
        Returns: string
      }
      mark_integrity_problem_pending: {
        Args: { p_problem_identifier: string; p_problem_type: string }
        Returns: string
      }
      mark_integrity_problem_resolved: {
        Args: {
          p_notes?: string
          p_problem_identifier: string
          p_problem_type: string
        }
        Returns: string
      }
      normalize_all_data: {
        Args: never
        Returns: {
          field_name: string
          records_updated: number
          table_name: string
        }[]
      }
      normalize_text: { Args: { input_text: string }; Returns: string }
      registrar_evento_patrimonio: {
        Args: {
          p_campo_alterado?: string
          p_codigo_pat: string
          p_data_evento_real?: string
          p_detalhes_evento: string
          p_pat_id: string
          p_tipo_evento: string
          p_valor_antigo?: string
          p_valor_novo?: string
        }
        Returns: string
      }
      update_maintenance_status: { Args: never; Returns: undefined }
      verify_audit_log_integrity: {
        Args: { p_log_id: string }
        Returns: boolean
      }
      verify_audit_log_signature: {
        Args: { p_log_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "superuser"
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
      app_role: ["admin", "user", "superuser"],
    },
  },
} as const
