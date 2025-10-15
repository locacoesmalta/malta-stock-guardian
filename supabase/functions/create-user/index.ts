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

    console.log('Creating user with email:', email)

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
      console.error('Error creating user:', createError)
      throw createError
    }

    if (!newUser.user) {
      console.error('No user returned from createUser')
      throw new Error('Erro ao criar usuário')
    }

    console.log('User created successfully:', newUser.user.id)

    // Wait for trigger to create initial permission record
    await new Promise(resolve => setTimeout(resolve, 500))

    console.log('Upserting permissions for user:', newUser.user.id)

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
      }, {
        onConflict: 'user_id'
      })

    if (permError) {
      console.error('Error upserting permissions:', permError)
      throw permError
    }

    console.log('Permissions upserted successfully')

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
