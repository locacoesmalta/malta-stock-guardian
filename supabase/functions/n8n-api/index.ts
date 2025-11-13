import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';
import { validateQueryParam, validateUUID } from '../_shared/sanitization.ts';
import { checkRateLimit, getClientIP } from '../_shared/rateLimit.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const n8nApiKey = Deno.env.get('N8N_API_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const ip = getClientIP(req);
    if (!checkRateLimit(ip, 30, 60000)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API Key
    const authHeader = req.headers.get('x-api-key');
    if (authHeader !== n8nApiKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid API Key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();

    console.log(`N8N API - Endpoint: ${endpoint}`);

    // GET /products - Lista produtos com filtros
    if (endpoint === 'products' && req.method === 'GET') {
      const searchTerm = validateQueryParam(url.searchParams.get('search'), 100) || '';
      const minStock = url.searchParams.get('min_stock');
      const lowStock = url.searchParams.get('low_stock') === 'true';

      let query = supabase
        .from('products')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
      }

      if (minStock) {
        query = query.gte('quantity', parseInt(minStock));
      }

      if (lowStock) {
        query = query.lte('quantity', supabase.from('products').select('min_quantity'));
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar produtos com estoque baixo manualmente se necessário
      let results = data || [];
      if (lowStock) {
        results = results.filter(p => p.quantity <= p.min_quantity);
      }

      return new Response(
        JSON.stringify({ success: true, data: results, count: results.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /products/:id - Busca produto específico
    if (endpoint?.startsWith('product-') && req.method === 'GET') {
      const productId = endpoint.replace('product-', '');
      
      if (!validateUUID(productId)) {
        return new Response(
          JSON.stringify({ error: 'Invalid product ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /low-stock - Produtos com estoque baixo
    if (endpoint === 'low-stock' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('quantity', { ascending: true });

      if (error) throw error;

      const lowStockProducts = (data || []).filter(p => p.quantity <= p.min_quantity);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: lowStockProducts, 
          count: lowStockProducts.length,
          critical: lowStockProducts.filter(p => p.quantity === 0).length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /withdrawals - Histórico de retiradas com filtros
    if (endpoint === 'withdrawals' && req.method === 'GET') {
      const workSite = url.searchParams.get('work_site');
      const company = url.searchParams.get('company');
      const equipmentCode = url.searchParams.get('equipment_code');
      const productId = url.searchParams.get('product_id');
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');
      const limit = url.searchParams.get('limit') || '100';

      let query = supabase
        .from('material_withdrawals')
        .select(`
          *,
          products(id, code, name),
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (workSite) {
        query = query.ilike('work_site', `%${workSite}%`);
      }

      if (company) {
        query = query.ilike('company', `%${company}%`);
      }

      if (equipmentCode) {
        query = query.ilike('equipment_code', `%${equipmentCode}%`);
      }

      if (productId) {
        query = query.eq('product_id', productId);
      }

      if (startDate) {
        query = query.gte('withdrawal_date', startDate);
      }

      if (endDate) {
        query = query.lte('withdrawal_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data: data || [], count: data?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /stock-summary - Resumo de estoque
    if (endpoint === 'stock-summary' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('products')
        .select('*');

      if (error) throw error;

      const products = data || [];
      const summary = {
        total_products: products.length,
        total_stock_value: products.reduce((sum, p) => 
          sum + (p.quantity * (p.purchase_price || 0)), 0
        ),
        low_stock_count: products.filter(p => p.quantity <= p.min_quantity && p.quantity > 0).length,
        out_of_stock_count: products.filter(p => p.quantity === 0).length,
        healthy_stock_count: products.filter(p => p.quantity > p.min_quantity).length,
      };

      return new Response(
        JSON.stringify({ success: true, data: summary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============= ENDPOINTS DE EQUIPAMENTOS (ASSETS) =============

    // GET /assets - Lista equipamentos com filtros
    if (endpoint === 'assets' && req.method === 'GET') {
      const searchTerm = url.searchParams.get('search') || '';
      const locationType = url.searchParams.get('location_type');
      const company = url.searchParams.get('company');
      const workSite = url.searchParams.get('work_site');
      const limit = url.searchParams.get('limit') || '100';

      let query = supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (searchTerm) {
        query = query.or(`asset_code.ilike.%${searchTerm}%,equipment_name.ilike.%${searchTerm}%`);
      }

      if (locationType) {
        query = query.eq('location_type', locationType);
      }

      if (company) {
        query = query.or(`rental_company.ilike.%${company}%,maintenance_company.ilike.%${company}%`);
      }

      if (workSite) {
        query = query.or(`rental_work_site.ilike.%${workSite}%,maintenance_work_site.ilike.%${workSite}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data: data || [], count: data?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /asset-{id} - Busca equipamento específico
    if (endpoint?.startsWith('asset-') && req.method === 'GET') {
      const assetId = endpoint.replace('asset-', '');
      
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /assets-by-code/{code} - Busca equipamento por código
    if (endpoint?.startsWith('assets-by-code-') && req.method === 'GET') {
      const assetCode = endpoint.replace('assets-by-code-', '');
      
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('asset_code', assetCode)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /assets-maintenance - Equipamentos em manutenção
    if (endpoint === 'assets-maintenance' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('location_type', 'em_manutencao')
        .order('maintenance_arrival_date', { ascending: true });

      if (error) throw error;

      // Adicionar cálculo de dias em manutenção
      const assetsWithDays = (data || []).map(asset => {
        if (asset.maintenance_arrival_date) {
          const arrival = new Date(asset.maintenance_arrival_date);
          const today = new Date();
          const diffTime = today.getTime() - arrival.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          return { ...asset, days_in_maintenance: diffDays };
        }
        return asset;
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: assetsWithDays, 
          count: assetsWithDays.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /assets-rental - Equipamentos em locação
    if (endpoint === 'assets-rental' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('location_type', 'locacao')
        .order('rental_start_date', { ascending: false });

      if (error) throw error;

      // Adicionar cálculo de dias em locação
      const assetsWithDays = (data || []).map(asset => {
        if (asset.rental_start_date) {
          const start = new Date(asset.rental_start_date);
          const end = asset.rental_end_date ? new Date(asset.rental_end_date) : new Date();
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          return { ...asset, days_in_rental: diffDays };
        }
        return asset;
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: assetsWithDays, 
          count: assetsWithDays.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /assets-stats - Estatísticas dos equipamentos
    if (endpoint === 'assets-stats' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('assets')
        .select('*');

      if (error) throw error;

      const assets = data || [];
      const stats = {
        total_assets: assets.length,
        by_location: {
          deposito_malta: assets.filter(a => a.location_type === 'deposito_malta').length,
          em_manutencao: assets.filter(a => a.location_type === 'em_manutencao').length,
          locacao: assets.filter(a => a.location_type === 'locacao').length,
          aguardando_laudo: assets.filter(a => a.location_type === 'aguardando_laudo').length,
        },
        maintenance_stats: {
          total_in_maintenance: assets.filter(a => a.location_type === 'em_manutencao').length,
          avg_days_in_maintenance: (() => {
            const inMaintenance = assets.filter(a => 
              a.location_type === 'em_manutencao' && a.maintenance_arrival_date
            );
            if (inMaintenance.length === 0) return 0;
            
            const totalDays = inMaintenance.reduce((sum, asset) => {
              const arrival = new Date(asset.maintenance_arrival_date);
              const today = new Date();
              const diffTime = today.getTime() - arrival.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              return sum + diffDays;
            }, 0);
            
            return Math.round(totalDays / inMaintenance.length);
          })(),
        },
        rental_stats: {
          total_in_rental: assets.filter(a => a.location_type === 'locacao').length,
          by_company: (() => {
            const companies: Record<string, number> = {};
            assets
              .filter(a => a.location_type === 'locacao' && a.rental_company)
              .forEach(a => {
                companies[a.rental_company!] = (companies[a.rental_company!] || 0) + 1;
              });
            return companies;
          })(),
        },
      };

      return new Response(
        JSON.stringify({ success: true, data: stats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /asset-history/{assetId} - Histórico de um equipamento
    if (endpoint?.startsWith('asset-history-') && req.method === 'GET') {
      const assetId = endpoint.replace('asset-history-', '');
      
      const { data, error } = await supabase
        .from('patrimonio_historico')
        .select('*')
        .eq('pat_id', assetId)
        .order('data_modificacao', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data: data || [], count: data?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Endpoint não encontrado
    return new Response(
      JSON.stringify({ 
        error: 'Endpoint not found',
        available_endpoints: {
          products: [
            'GET /products - Lista produtos (params: search, min_stock, low_stock, limit)',
            'GET /product-{id} - Busca produto por ID',
            'GET /low-stock - Produtos com estoque baixo',
            'GET /stock-summary - Resumo geral do estoque',
          ],
          assets: [
            'GET /assets - Lista equipamentos (params: search, location_type, company, work_site, limit)',
            'GET /asset-{id} - Busca equipamento por ID',
            'GET /assets-by-code-{code} - Busca equipamento por código',
            'GET /assets-maintenance - Equipamentos em manutenção com dias calculados',
            'GET /assets-rental - Equipamentos em locação com dias calculados',
            'GET /assets-stats - Estatísticas gerais dos equipamentos',
            'GET /asset-history-{id} - Histórico de alterações de um equipamento',
          ],
          withdrawals: [
            'GET /withdrawals - Histórico de retiradas (params: work_site, company, equipment_code, product_id, start_date, end_date, limit)',
          ]
        },
        authentication: 'Include header: x-api-key: YOUR_N8N_API_KEY'
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('N8N API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
