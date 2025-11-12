import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[CLEANUP] Starting stale sessions cleanup...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calcular timestamp de 24 horas atrás
    const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    console.log(`[CLEANUP] Marking sessions as offline with last_activity before: ${staleThreshold}`);

    // Buscar sessões que serão afetadas (para log)
    const { data: staleSessions, error: fetchError } = await supabase
      .from('user_presence')
      .select('id, user_email, last_activity')
      .eq('is_online', true)
      .lt('last_activity', staleThreshold);

    if (fetchError) {
      console.error('[CLEANUP] Error fetching stale sessions:', fetchError);
      throw fetchError;
    }

    const staleCount = staleSessions?.length || 0;
    console.log(`[CLEANUP] Found ${staleCount} stale session(s) to clean`);

    if (staleCount > 0) {
      // Log detalhes das sessões que serão limpas
      staleSessions.forEach(session => {
        console.log(`[CLEANUP] - User: ${session.user_email}, Last activity: ${session.last_activity}`);
      });

      // Marcar sessões como offline
      const { error: updateError } = await supabase
        .from('user_presence')
        .update({ is_online: false })
        .eq('is_online', true)
        .lt('last_activity', staleThreshold);

      if (updateError) {
        console.error('[CLEANUP] Error updating sessions:', updateError);
        throw updateError;
      }

      console.log(`[CLEANUP] Successfully marked ${staleCount} session(s) as offline`);
    } else {
      console.log('[CLEANUP] No stale sessions found');
    }

    // Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        cleaned_sessions: staleCount,
        threshold: staleThreshold,
        message: `Cleaned ${staleCount} stale session(s)`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[CLEANUP] Fatal error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
