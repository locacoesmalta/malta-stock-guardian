import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

const INTERNAL_SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const INTERNAL_SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXTERNAL_SUPABASE_URL = Deno.env.get('EXTERNAL_SUPABASE_URL')!;
const EXTERNAL_SUPABASE_SERVICE_KEY = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_KEY')!;

// Cliente interno (source)
const internalClient = createClient(INTERNAL_SUPABASE_URL, INTERNAL_SUPABASE_SERVICE_KEY);

// Cliente externo (destination)
const externalClient = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_SERVICE_KEY);

// Ordem de sincronização respeitando dependências
const SYNC_ORDER = [
  // Base - sem dependências
  'profiles',
  'equipment_rental_catalog',
  
  // Dependem de profiles
  'user_roles',
  'user_permissions',
  'user_presence',
  
  // Base para outros
  'products',
  'rental_companies',
  
  // Dependem de products/assets
  'assets',
  'product_purchases',
  'product_stock_adjustments',
  
  // Dependem de assets
  'asset_collaborators',
  'asset_lifecycle_history',
  'asset_maintenances',
  'asset_maintenance_parts',
  'asset_mobilization_expenses',
  'asset_mobilization_parts',
  'asset_spare_parts',
  'equipment_receipts',
  'equipment_receipt_items',
  
  // Dependem de rental_companies
  'rental_equipment',
  
  // Reports e relacionados
  'reports',
  'report_parts',
  'report_photos',
  'report_external_services',
  
  // Material withdrawals
  'material_withdrawals',
  'material_withdrawal_collaborators',
  
  // Chat
  'conversations',
  'conversation_participants',
  'chat_groups',
  'group_permissions',
  'messages',
  
  // Financeiro
  'cash_boxes',
  'cash_box_transactions',
  
  // Audit (sempre por último)
  'patrimonio_historico',
  'audit_logs',
  'error_logs',
  'receipt_access_logs',
  'system_integrity_resolutions',
];

// Mapeamento de tabelas com chave primária diferente de 'id'
const PRIMARY_KEY_MAP: Record<string, string> = {
  'patrimonio_historico': 'historico_id',
};

interface SyncStats {
  table: string;
  records_synced: number;
  success: boolean;
  error?: string;
  duration_ms: number;
}

// Função para buscar TODOS os registros com paginação automática
async function fetchAllRecords(client: any, tableName: string): Promise<any[]> {
  const PAGE_SIZE = 1000;
  const pkColumn = PRIMARY_KEY_MAP[tableName] || 'id';
  let allData: any[] = [];
  let offset = 0;
  let hasMore = true;
  
  console.log(`[Sync] ${tableName}: Iniciando busca paginada...`);
  
  while (hasMore) {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .range(offset, offset + PAGE_SIZE - 1)
      .order(pkColumn);
    
    if (error) {
      throw new Error(`Erro ao buscar ${tableName} (offset ${offset}): ${error.message}`);
    }
    
    if (data && data.length > 0) {
      allData = [...allData, ...data];
      console.log(`[Sync] ${tableName}: ${allData.length} registros carregados...`);
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE; // Se retornou menos que PAGE_SIZE, acabou
    } else {
      hasMore = false;
    }
  }
  
  return allData;
}

async function syncTable(tableName: string): Promise<SyncStats> {
  const startTime = Date.now();
  
  try {
    console.log(`[Sync] Iniciando sincronização da tabela: ${tableName}`);
    
    // Buscar TODOS os dados da tabela interna com paginação
    const internalData = await fetchAllRecords(internalClient, tableName);
    
    if (!internalData || internalData.length === 0) {
      console.log(`[Sync] Tabela ${tableName} vazia, pulando...`);
      return {
        table: tableName,
        records_synced: 0,
        success: true,
        duration_ms: Date.now() - startTime,
      };
    }
    
    console.log(`[Sync] ${tableName}: ${internalData.length} registros encontrados (busca paginada concluída)`);
    
    // Obter nome da coluna da chave primária para esta tabela
    const pkColumn = PRIMARY_KEY_MAP[tableName] || 'id';
    
    // Deletar dados existentes na tabela externa usando a PK correta
    const { error: deleteError } = await externalClient
      .from(tableName)
      .delete()
      .neq(pkColumn, '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.warn(`[Sync] Aviso ao limpar ${tableName}: ${deleteError.message}`);
    }
    
    // Inserir dados em lotes de 1000 registros
    const batchSize = 1000;
    let totalSynced = 0;
    
    for (let i = 0; i < internalData.length; i += batchSize) {
      const batch = internalData.slice(i, i + batchSize);
      
      const { error: insertError } = await externalClient
        .from(tableName)
        .insert(batch);
      
      if (insertError) {
        throw new Error(`Erro ao inserir dados em ${tableName}: ${insertError.message}`);
      }
      
      totalSynced += batch.length;
      console.log(`[Sync] ${tableName}: ${totalSynced}/${internalData.length} registros sincronizados`);
    }
    
    return {
      table: tableName,
      records_synced: totalSynced,
      success: true,
      duration_ms: Date.now() - startTime,
    };
    
  } catch (error) {
    console.error(`[Sync] Erro em ${tableName}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      table: tableName,
      records_synced: 0,
      success: false,
      error: errorMessage,
      duration_ms: Date.now() - startTime,
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🔒 SECURITY: Validate Authentication (API Key OR Bearer Token)
    let isAuthorized = false;
    
    // Method 1: API Key (for external integrations like N8N)
    const apiKey = Deno.env.get('N8N_API_KEY');
    const apiKeyHeader = req.headers.get('x-api-key');
    
    if (apiKey && apiKeyHeader === apiKey) {
      isAuthorized = true;
      console.log('[Sync] Authenticated via API Key');
    }
    
    // Method 2: Bearer Token (for frontend admin/owner)
    if (!isAuthorized) {
      const bearerHeader = req.headers.get('Authorization');
      
      if (bearerHeader?.startsWith('Bearer ')) {
        const token = bearerHeader.replace('Bearer ', '');
        
        try {
          const { data: { user }, error } = await internalClient.auth.getUser(token);
          
          if (user && !error) {
            // Check if user is system owner
            const { data: isOwner, error: ownerError } = await internalClient
              .rpc('is_system_owner', { user_id: user.id });
            
            if (!ownerError && isOwner) {
              isAuthorized = true;
              console.log(`[Sync] Authenticated as system owner: ${user.email}`);
            }
          }
        } catch (e) {
          console.error('[Sync] Bearer token validation error:', e);
        }
      }
    }
    
    if (!isAuthorized) {
      console.error('[Sync] Unauthorized access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or missing credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    // Extract path after the function name (handles /functions/v1/sync-to-external/xxx)
    const path = url.pathname.split('/sync-to-external')[1] || '/';

    // POST /full - Sincronização completa
    if (path === '/full' && req.method === 'POST') {
      console.log('[Sync] Iniciando sincronização completa de 39 tabelas...');
      const startTime = Date.now();
      
      const results: SyncStats[] = [];
      
      for (const tableName of SYNC_ORDER) {
        const stats = await syncTable(tableName);
        results.push(stats);
      }
      
      const totalDuration = Date.now() - startTime;
      const successCount = results.filter(r => r.success).length;
      const totalRecords = results.reduce((sum, r) => sum + r.records_synced, 0);
      
      console.log(`[Sync] Sincronização completa finalizada: ${successCount}/${results.length} tabelas`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Sincronização completa: ${successCount}/${results.length} tabelas`,
          total_records_synced: totalRecords,
          total_duration_ms: totalDuration,
          tables: results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /table/:name - Sincronização de tabela específica
    if (path.startsWith('/table/') && req.method === 'POST') {
      const tableName = path.replace('/table/', '');
      
      if (!SYNC_ORDER.includes(tableName)) {
        return new Response(
          JSON.stringify({ error: `Tabela '${tableName}' não encontrada na configuração de sincronização` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const stats = await syncTable(tableName);
      
      return new Response(
        JSON.stringify({
          success: stats.success,
          table: stats,
        }),
        { 
          status: stats.success ? 200 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // GET /status - Status da sincronização
    if (path === '/status' && req.method === 'GET') {
      // Buscar contagem de registros em ambos os bancos (TODAS as 38 tabelas)
      const counts: any = {};
      
      for (const tableName of SYNC_ORDER) {
        try {
          const { count: internalCount } = await internalClient
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          const { count: externalCount, error: externalError } = await externalClient
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          counts[tableName] = {
            internal: internalCount || 0,
            external: externalError ? -1 : (externalCount || 0), // -1 indica erro
            synced: !externalError && internalCount === externalCount,
            error: externalError?.message || undefined, // Captura erro específico
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          counts[tableName] = { 
            internal: 0, 
            external: -1, 
            synced: false,
            error: errorMessage 
          };
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          total_tables: SYNC_ORDER.length,
          sample_counts: counts,
          sync_order: SYNC_ORDER,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /diagnose - Verificar se tabelas existem no banco externo
    if (path === '/diagnose' && req.method === 'GET') {
      console.log('[Sync] Iniciando diagnóstico de tabelas...');
      const diagnostics = [];
      
      for (const tableName of SYNC_ORDER) {
        try {
          const { error } = await externalClient.from(tableName).select('*').limit(1);
          diagnostics.push({
            table: tableName,
            exists: !error,
            error: error?.message || null
          });
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          diagnostics.push({
            table: tableName,
            exists: false,
            error: errorMessage
          });
        }
      }
      
      const missingTables = diagnostics.filter(d => !d.exists);
      
      return new Response(
        JSON.stringify({
          success: true,
          total_tables: SYNC_ORDER.length,
          existing_tables: diagnostics.filter(d => d.exists).length,
          missing_tables: missingTables.length,
          diagnostics,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /incremental - Sincronização incremental (dados novos/alterados)
    if (path === '/incremental' && req.method === 'POST') {
      const { since } = await req.json();
      
      if (!since) {
        return new Response(
          JSON.stringify({ error: "Parâmetro 'since' (timestamp) é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`[Sync] Sincronização incremental desde: ${since}`);
      const results: SyncStats[] = [];
      
      for (const tableName of SYNC_ORDER) {
        const startTime = Date.now();
        
        try {
          // Buscar apenas registros novos/alterados
          const { data: newData, error: fetchError } = await internalClient
            .from(tableName)
            .select('*')
            .or(`created_at.gte.${since},updated_at.gte.${since}`);
          
          if (fetchError || !newData || newData.length === 0) {
            results.push({
              table: tableName,
              records_synced: 0,
              success: true,
              duration_ms: Date.now() - startTime,
            });
            continue;
          }
          
          // Upsert (insert ou update)
          const { error: upsertError } = await externalClient
            .from(tableName)
            .upsert(newData);
          
          results.push({
            table: tableName,
            records_synced: newData.length,
            success: !upsertError,
            error: upsertError?.message,
            duration_ms: Date.now() - startTime,
          });
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.push({
            table: tableName,
            records_synced: 0,
            success: false,
            error: errorMessage,
            duration_ms: Date.now() - startTime,
          });
        }
      }
      
      const totalRecords = results.reduce((sum, r) => sum + r.records_synced, 0);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Sincronização incremental: ${totalRecords} registros atualizados`,
          tables: results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Endpoint não encontrado
    return new Response(
      JSON.stringify({ 
        error: 'Endpoint não encontrado',
        available_endpoints: [
          'POST /full - Sincronização completa',
          'POST /table/:name - Sincronizar tabela específica',
          'GET /status - Status da sincronização (todas as 38 tabelas)',
          'GET /diagnose - Diagnóstico de tabelas no banco externo',
          'POST /incremental - Sincronização incremental (body: {since: "2025-01-01T00:00:00Z"})',
        ]
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Sync] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
