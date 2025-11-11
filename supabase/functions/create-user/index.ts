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

    // Check if user is system owner
    const { data: isOwner, error: ownerError } = await supabaseAdmin.rpc('is_system_owner', {
      _user_id: user.id
    })

    if (ownerError || !isOwner) {
      throw new Error('Apenas o proprietário do sistema pode criar usuários')
    }

    const { email, password, full_name, permissions } = await req.json()

    // Validate input
    if (!email || !password || !full_name) {
      throw new Error('Email, password e nome completo são obrigatórios')
    }

    if (password.length < 8) {
      throw new Error('A senha deve ter pelo menos 8 caracteres')
    }

    if (!/[A-Z]/.test(password)) {
      throw new Error('A senha deve conter pelo menos uma letra maiúscula')
    }

    if (!/[a-z]/.test(password)) {
      throw new Error('A senha deve conter pelo menos uma letra minúscula')
    }

    if (!/[0-9]/.test(password)) {
      throw new Error('A senha deve conter pelo menos um número')
    }

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

    // Wait for trigger to create initial permission record
    await new Promise(resolve => setTimeout(resolve, 500))

    // Upsert permissions - handles both insert and update
    const { error: permError } = await supabaseAdmin
      .from('user_permissions')
      .upsert({
        user_id: newUser.user.id,
        is_active: permissions.is_active,
        can_access_main_menu: permissions.can_access_main_menu,
        can_access_admin: permissions.can_access_admin,
        can_view_products: permissions.can_view_products,
        can_create_reports: permissions.can_create_reports,
        can_view_reports: permissions.can_view_reports,
        can_create_withdrawals: permissions.can_create_withdrawals,
        can_view_withdrawal_history: permissions.can_view_withdrawal_history,
        can_edit_products: permissions.can_edit_products,
        can_delete_products: permissions.can_delete_products,
        can_edit_reports: permissions.can_edit_reports,
        can_delete_reports: permissions.can_delete_reports,
        can_access_assets: permissions.can_access_assets,
        can_create_assets: permissions.can_create_assets,
        can_edit_assets: permissions.can_edit_assets,
        can_delete_assets: permissions.can_delete_assets,
        can_scan_assets: permissions.can_scan_assets,
        must_change_password: true
      }, {
        onConflict: 'user_id'
      })

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
