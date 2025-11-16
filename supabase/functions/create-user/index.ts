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
      return new Response(
        JSON.stringify({ error: 'Email, password e nome completo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ FASE 3: Validar email duplicado ANTES de criar
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUsers.users.some(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'Email já está em uso', code: 'EMAIL_EXISTS' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 8 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!/[A-Z]/.test(password)) {
      return new Response(
        JSON.stringify({ error: 'A senha deve conter pelo menos uma letra maiúscula' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!/[a-z]/.test(password)) {
      return new Response(
        JSON.stringify({ error: 'A senha deve conter pelo menos uma letra minúscula' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!/[0-9]/.test(password)) {
      return new Response(
        JSON.stringify({ error: 'A senha deve conter pelo menos um número' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      // ✅ FASE 3: Tratamento específico de erros do Supabase Auth
      let errorMessage = createError.message
      let statusCode = 500
      
      if (errorMessage.includes('already registered') || errorMessage.includes('User already registered')) {
        errorMessage = 'Email já está registrado'
        statusCode = 409
      } else if (errorMessage.includes('invalid email') || errorMessage.includes('Email format invalid')) {
        errorMessage = 'Email inválido'
        statusCode = 400
      } else if (errorMessage.includes('password')) {
        errorMessage = 'Senha inválida: ' + errorMessage
        statusCode = 400
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
    console.error('Erro ao criar usuário:', error)
    
    // ✅ SEMPRE retornar JSON estruturado, nunca string pura
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        stack: Deno.env.get('DENO_ENV') === 'development' ? (error as Error).stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
