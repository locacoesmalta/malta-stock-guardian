import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Não autorizado')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Não autorizado')
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Apenas administradores podem criar usuários')
    }

    const { email, password, full_name, permissions } = await req.json()

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name
      }
    })

    if (createError) {
      throw createError
    }

    if (!newUser.user) {
      throw new Error('Erro ao criar usuário')
    }

    // Update permissions - Usuários criados por admin recebem todas as permissões
    const { error: permError } = await supabaseAdmin
      .from('user_permissions')
      .update({
        is_active: true,
        can_access_main_menu: true,
        can_access_admin: true,
        can_view_products: true,
        can_create_reports: true,
        can_view_reports: true,
        can_create_withdrawals: true,
        can_view_withdrawal_history: true,
        can_edit_products: true,
        can_delete_products: true,
        can_edit_reports: true,
        can_delete_reports: true,
        can_access_assets: true,
        can_create_assets: true,
        can_edit_assets: true,
        can_delete_assets: true,
        can_scan_assets: true,
      })
      .eq('user_id', newUser.user.id)

    if (permError) {
      throw permError
    }

    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
