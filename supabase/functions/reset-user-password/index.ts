import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validação de senha forte
const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Senha deve ter no mínimo 8 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos uma letra maiúscula' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos uma letra minúscula' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos um número' };
  }
  return { valid: true };
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authenticated user from the JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(jwt);

    if (authError || !authUser) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('Request from user:', authUser.id);

    // Verify that the authenticated user is system owner
    const { data: isOwner, error: ownerError } = await supabaseAdmin.rpc('is_system_owner', {
      _user_id: authUser.id
    });

    if (ownerError || !isOwner) {
      console.error('User is not system owner:', authUser.id);
      throw new Error('Only system owner can reset user passwords');
    }

    console.log('Admin verified:', authUser.id);

    // Parse request body
    const { user_id, new_password, force_change_password = false } = await req.json();

    if (!user_id || !new_password) {
      throw new Error('Missing required fields: user_id and new_password');
    }

    console.log('Resetting password for user:', user_id);

    // Validate password strength
    const validation = validatePasswordStrength(new_password);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prevent admin from resetting their own password via this endpoint
    if (user_id === authUser.id) {
      return new Response(
        JSON.stringify({ error: 'Administradores devem usar o fluxo normal de alteração de senha' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update user password using Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw updateError;
    }

    console.log('Password updated successfully for user:', user_id);

    // Update must_change_password flag
    const { error: permError } = await supabaseAdmin
      .from('user_permissions')
      .update({ must_change_password: force_change_password })
      .eq('user_id', user_id);

    if (permError) {
      console.error('Error updating must_change_password flag:', permError);
      // Don't throw here, password was already changed
    }

    console.log('Password reset completed for user:', user_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Senha redefinida com sucesso',
        force_change_password 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in reset-user-password function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
