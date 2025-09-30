import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const n8nApiKey = Deno.env.get('N8N_API_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      const searchTerm = url.searchParams.get('search') || '';
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

    // Endpoint não encontrado
    return new Response(
      JSON.stringify({ 
        error: 'Endpoint not found',
        available_endpoints: [
          'GET /products - Lista produtos (params: search, min_stock, low_stock)',
          'GET /product-{id} - Busca produto por ID',
          'GET /low-stock - Produtos com estoque baixo',
          'GET /withdrawals - Histórico de retiradas (params: work_site, company, equipment_code, product_id, start_date, end_date, limit)',
          'GET /stock-summary - Resumo geral do estoque'
        ]
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
