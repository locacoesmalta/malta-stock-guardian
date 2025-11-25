import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const n8nApiKey = Deno.env.get('N8N_API_KEY')!;

// Rate limiting para operações de escrita (mais restritivo)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (clientIp: string, maxRequests: number = 50, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(clientIp);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(clientIp, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

// Validações de dados
const validatePAT = (pat: string): { valid: boolean; error?: string } => {
  if (!pat) return { valid: false, error: 'PAT é obrigatório' };
  
  const cleanPAT = pat.replace(/\D/g, '');
  if (cleanPAT.length !== 4) {
    return { valid: false, error: 'PAT deve ter 4 dígitos' };
  }
  
  return { valid: true };
};

const normalizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.trim().toUpperCase();
};

const validateRequiredFields = (data: any, locationType: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Campos sempre obrigatórios
  if (!data.equipment_name) errors.push('equipment_name é obrigatório');
  if (!data.manufacturer) errors.push('manufacturer é obrigatório');
  
  // Campos obrigatórios por tipo de localização
  if (locationType === 'em_manutencao') {
    if (!data.maintenance_company) errors.push('maintenance_company é obrigatório para manutenção');
    if (!data.maintenance_work_site) errors.push('maintenance_work_site é obrigatório para manutenção');
    if (!data.maintenance_arrival_date) errors.push('maintenance_arrival_date é obrigatório para manutenção');
  }
  
  if (locationType === 'locacao') {
    if (!data.rental_company) errors.push('rental_company é obrigatório para locação');
    if (!data.rental_work_site) errors.push('rental_work_site é obrigatório para locação');
    if (!data.rental_start_date) errors.push('rental_start_date é obrigatório para locação');
  }
  
  return { valid: errors.length === 0, errors };
};

const validateDates = (data: any, locationType: string): { valid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Validar datas retroativas (warning, não erro)
  if (locationType === 'em_manutencao' && data.maintenance_arrival_date) {
    const arrivalDate = new Date(data.maintenance_arrival_date);
    if (arrivalDate < sevenDaysAgo) {
      warnings.push(`maintenance_arrival_date está ${Math.floor((now.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24))} dias no passado`);
    }
    
    if (data.maintenance_departure_date) {
      const departureDate = new Date(data.maintenance_departure_date);
      if (departureDate < arrivalDate) {
        return { valid: false, warnings: ['maintenance_departure_date não pode ser anterior a maintenance_arrival_date'] };
      }
    }
  }
  
  if (locationType === 'locacao' && data.rental_start_date) {
    const startDate = new Date(data.rental_start_date);
    if (startDate < sevenDaysAgo) {
      warnings.push(`rental_start_date está ${Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} dias no passado`);
    }
    
    if (data.rental_end_date) {
      const endDate = new Date(data.rental_end_date);
      if (endDate < startDate) {
        return { valid: false, warnings: ['rental_end_date não pode ser anterior a rental_start_date'] };
      }
    }
  }
  
  return { valid: true, warnings };
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const endpoint = pathParts[pathParts.length - 1];

  // ========== GET /catalog - Endpoint público para catálogo de equipamentos ==========
  if (endpoint === 'catalog' && req.method === 'GET') {
    try {
      console.log('📋 Fetching equipment rental catalog...');

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Buscar catálogo
      const { data: catalog, error: catalogError } = await supabase
        .from('equipment_rental_catalog')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (catalogError) {
        console.error('Error fetching catalog:', catalogError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to fetch catalog',
            details: catalogError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Calcular quantidade disponível para cada tipo de equipamento
      const catalogWithQuantity = await Promise.all(
        (catalog || []).map(async (item) => {
          const { count } = await supabase
            .from('assets')
            .select('*', { count: 'exact', head: true })
            .eq('equipment_name', item.name)
            .is('deleted_at', null)
            .or('location_type.eq.deposito_malta,available_for_rental.eq.true');

          return {
            ...item,
            available_quantity: count || 0
          };
        })
      );

      console.log(`✅ Catalog fetched: ${catalogWithQuantity.length} items`);

      return new Response(
        JSON.stringify({
          success: true,
          data: catalogWithQuantity,
          total: catalogWithQuantity.length
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } catch (error) {
      console.error('Error in catalog endpoint:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Internal server error',
          details: (error as Error).message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  }

  // ========== GET /availability - Endpoint público para equipamentos disponíveis ==========
  if (endpoint === 'availability' && req.method === 'GET') {
    try {
      console.log('📦 Fetching available equipment for rental...');

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const url = new URL(req.url);
      const nameFilter = url.searchParams.get('name');

      // Query base: equipamentos no Depósito Malta (disponíveis)
      let query = supabase
        .from('assets')
        .select('equipment_name, asset_code, manufacturer')
        .eq('location_type', 'deposito_malta')
        .is('deleted_at', null)
        .order('equipment_name');

      // Filtro opcional por nome (busca parcial case-insensitive)
      if (nameFilter) {
        query = query.ilike('equipment_name', `%${nameFilter}%`);
      }

      const { data: availableAssets, error: queryError } = await query;

      if (queryError) {
        console.error('Error fetching available equipment:', queryError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to fetch available equipment',
            details: queryError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`✅ Available equipment fetched: ${availableAssets?.length || 0} items`);

      return new Response(
        JSON.stringify({
          success: true,
          data: availableAssets || [],
          total: availableAssets?.length || 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } catch (error) {
      console.error('Error in availability endpoint:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Internal server error',
          details: (error as Error).message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  }

  try {
    // Rate limiting para operações de escrita
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(clientIp, 50, 60000)) { // 50 req/min para operações de escrita
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API Key para operações de escrita
    const authHeader = req.headers.get('x-api-key');
    if (authHeader !== n8nApiKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid API Key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const action = pathParts[pathParts.length - 2] || endpoint;

    console.log(`Sync Assets API - Action: ${action}, Method: ${req.method}`);

    // ========== POST /create - Criar novo equipamento ==========
    if (action === 'create' && req.method === 'POST') {
      const body = await req.json();
      const syncId = crypto.randomUUID();
      
      console.log('Create Asset Request:', { body, syncId });

      // Validar PAT
      const patValidation = validatePAT(body.asset_code);
      if (!patValidation.valid) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: patValidation.error,
            sync_id: syncId 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const cleanPAT = body.asset_code.replace(/\D/g, '').padStart(4, '0');

      // Verificar se PAT já existe
      const { data: existingAsset } = await supabase
        .from('assets')
        .select('id, asset_code')
        .eq('asset_code', cleanPAT)
        .maybeSingle();

      if (existingAsset) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `PAT ${cleanPAT} já existe no sistema`,
            existing_asset: existingAsset,
            sync_id: syncId 
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Normalizar localização padrão
      const locationType = body.location_type || 'deposito_malta';

      // Validar campos obrigatórios
      const fieldsValidation = validateRequiredFields(body, locationType);
      if (!fieldsValidation.valid) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            errors: fieldsValidation.errors,
            sync_id: syncId 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validar datas
      const datesValidation = validateDates(body, locationType);
      if (!datesValidation.valid) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            errors: datesValidation.warnings,
            sync_id: syncId 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Preparar dados do equipamento
      const assetData: any = {
        asset_code: cleanPAT,
        equipment_name: normalizeText(body.equipment_name),
        manufacturer: normalizeText(body.manufacturer),
        location_type: locationType,
        model: body.model ? normalizeText(body.model) : null,
        serial_number: body.serial_number || null,
        voltage_combustion: body.voltage_combustion || null,
        equipment_condition: body.equipment_condition || null,
        comments: body.comments || null,
        effective_registration_date: body.effective_registration_date || new Date().toISOString().split('T')[0],
      };

      // Adicionar campos específicos por tipo de localização
      if (locationType === 'em_manutencao') {
        assetData.maintenance_company = normalizeText(body.maintenance_company);
        assetData.maintenance_work_site = normalizeText(body.maintenance_work_site);
        assetData.maintenance_arrival_date = body.maintenance_arrival_date;
        assetData.maintenance_departure_date = body.maintenance_departure_date || null;
        assetData.maintenance_description = body.maintenance_description || null;
        assetData.maintenance_delay_observations = body.maintenance_delay_observations || null;
      }

      if (locationType === 'locacao') {
        assetData.rental_company = normalizeText(body.rental_company);
        assetData.rental_work_site = normalizeText(body.rental_work_site);
        assetData.rental_start_date = body.rental_start_date;
        assetData.rental_end_date = body.rental_end_date || null;
        assetData.rental_contract_number = body.rental_contract_number || null;
      }

      if (locationType === 'deposito_malta') {
        assetData.deposito_description = body.deposito_description || null;
      }

      // Inserir equipamento
      const { data: newAsset, error: insertError } = await supabase
        .from('assets')
        .insert(assetData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert Error:', insertError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Erro ao criar equipamento: ${insertError.message}`,
            sync_id: syncId 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Registrar no histórico usando RPC
      await supabase.rpc('registrar_evento_patrimonio', {
        p_pat_id: newAsset.id,
        p_codigo_pat: cleanPAT,
        p_tipo_evento: 'SYNC_CREATE',
        p_detalhes_evento: `Equipamento criado via API de sincronização. Localização: ${locationType}`,
        p_data_evento_real: body.effective_registration_date || new Date().toISOString(),
      });

      console.log('Asset created successfully:', newAsset.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: newAsset,
          sync_id: syncId,
          timestamp: new Date().toISOString(),
          warnings: datesValidation.warnings,
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== PUT /update/:code - Atualizar equipamento ==========
    if (action === 'update' && req.method === 'PUT') {
      const assetCode = endpoint;
      const body = await req.json();
      const syncId = crypto.randomUUID();

      console.log('Update Asset Request:', { assetCode, body, syncId });

      const cleanPAT = assetCode.replace(/\D/g, '').padStart(4, '0');

      // Buscar equipamento existente
      const { data: existingAsset, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('asset_code', cleanPAT)
        .maybeSingle();

      if (fetchError || !existingAsset) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Equipamento ${cleanPAT} não encontrado`,
            sync_id: syncId 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Preparar dados de atualização (apenas campos fornecidos)
      const updateData: any = {};
      const changedFields: string[] = [];

      if (body.equipment_name && body.equipment_name !== existingAsset.equipment_name) {
        updateData.equipment_name = normalizeText(body.equipment_name);
        changedFields.push('equipment_name');
      }

      if (body.manufacturer && body.manufacturer !== existingAsset.manufacturer) {
        updateData.manufacturer = normalizeText(body.manufacturer);
        changedFields.push('manufacturer');
      }

      if (body.model !== undefined && body.model !== existingAsset.model) {
        updateData.model = body.model ? normalizeText(body.model) : null;
        changedFields.push('model');
      }

      if (body.serial_number !== undefined && body.serial_number !== existingAsset.serial_number) {
        updateData.serial_number = body.serial_number;
        changedFields.push('serial_number');
      }

      if (body.voltage_combustion !== undefined && body.voltage_combustion !== existingAsset.voltage_combustion) {
        updateData.voltage_combustion = body.voltage_combustion;
        changedFields.push('voltage_combustion');
      }

      if (body.equipment_condition !== undefined && body.equipment_condition !== existingAsset.equipment_condition) {
        updateData.equipment_condition = body.equipment_condition;
        changedFields.push('equipment_condition');
      }

      if (body.comments !== undefined && body.comments !== existingAsset.comments) {
        updateData.comments = body.comments;
        changedFields.push('comments');
      }

      if (changedFields.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: existingAsset,
            message: 'Nenhuma alteração detectada',
            sync_id: syncId,
            timestamp: new Date().toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Atualizar equipamento
      const { data: updatedAsset, error: updateError } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', existingAsset.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update Error:', updateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Erro ao atualizar equipamento: ${updateError.message}`,
            sync_id: syncId 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Registrar no histórico
      await supabase.rpc('registrar_evento_patrimonio', {
        p_pat_id: existingAsset.id,
        p_codigo_pat: cleanPAT,
        p_tipo_evento: 'SYNC_UPDATE',
        p_detalhes_evento: `Equipamento atualizado via API. Campos: ${changedFields.join(', ')}`,
      });

      console.log('Asset updated successfully:', updatedAsset.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: updatedAsset,
          changed_fields: changedFields,
          sync_id: syncId,
          timestamp: new Date().toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== PATCH /move/:code - Movimentar equipamento ==========
    if (action === 'move' && req.method === 'PATCH') {
      const assetCode = endpoint;
      const body = await req.json();
      const syncId = crypto.randomUUID();

      console.log('Move Asset Request:', { assetCode, body, syncId });

      const cleanPAT = assetCode.replace(/\D/g, '').padStart(4, '0');

      // Buscar equipamento existente
      const { data: existingAsset, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('asset_code', cleanPAT)
        .maybeSingle();

      if (fetchError || !existingAsset) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Equipamento ${cleanPAT} não encontrado`,
            sync_id: syncId 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newLocationType = body.location_type;
      if (!newLocationType) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'location_type é obrigatório para movimentação',
            sync_id: syncId 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validar campos obrigatórios para a nova localização
      const fieldsValidation = validateRequiredFields(body, newLocationType);
      if (!fieldsValidation.valid) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            errors: fieldsValidation.errors,
            sync_id: syncId 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validar datas
      const datesValidation = validateDates(body, newLocationType);
      if (!datesValidation.valid) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            errors: datesValidation.warnings,
            sync_id: syncId 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Preparar dados de movimentação
      const moveData: any = {
        location_type: newLocationType,
        // Limpar dados da localização anterior
        rental_company: null,
        rental_work_site: null,
        rental_start_date: null,
        rental_end_date: null,
        rental_contract_number: null,
        maintenance_company: null,
        maintenance_work_site: null,
        maintenance_arrival_date: null,
        maintenance_departure_date: null,
        maintenance_description: null,
        maintenance_delay_observations: null,
        deposito_description: null,
      };

      // Adicionar dados da nova localização
      if (newLocationType === 'em_manutencao') {
        moveData.maintenance_company = normalizeText(body.maintenance_company);
        moveData.maintenance_work_site = normalizeText(body.maintenance_work_site);
        moveData.maintenance_arrival_date = body.maintenance_arrival_date;
        moveData.maintenance_departure_date = body.maintenance_departure_date || null;
        moveData.maintenance_description = body.maintenance_description || null;
        moveData.maintenance_delay_observations = body.maintenance_delay_observations || null;
      }

      if (newLocationType === 'locacao') {
        moveData.rental_company = normalizeText(body.rental_company);
        moveData.rental_work_site = normalizeText(body.rental_work_site);
        moveData.rental_start_date = body.rental_start_date;
        moveData.rental_end_date = body.rental_end_date || null;
        moveData.rental_contract_number = body.rental_contract_number || null;
      }

      if (newLocationType === 'deposito_malta') {
        moveData.deposito_description = body.deposito_description || null;
      }

      // Atualizar equipamento
      const { data: movedAsset, error: moveError } = await supabase
        .from('assets')
        .update(moveData)
        .eq('id', existingAsset.id)
        .select()
        .single();

      if (moveError) {
        console.error('Move Error:', moveError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Erro ao movimentar equipamento: ${moveError.message}`,
            sync_id: syncId 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Registrar no histórico
      await supabase.rpc('registrar_evento_patrimonio', {
        p_pat_id: existingAsset.id,
        p_codigo_pat: cleanPAT,
        p_tipo_evento: 'SYNC_MOVE',
        p_detalhes_evento: `Equipamento movimentado via API: ${existingAsset.location_type} → ${newLocationType}`,
      });

      console.log('Asset moved successfully:', movedAsset.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: movedAsset,
          previous_location: existingAsset.location_type,
          new_location: newLocationType,
          sync_id: syncId,
          timestamp: new Date().toISOString(),
          warnings: datesValidation.warnings,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== POST /bulk - Operação em lote ==========
    if (action === 'bulk' && req.method === 'POST') {
      const body = await req.json();
      const syncId = crypto.randomUUID();
      
      console.log('Bulk Operation Request:', { syncId, count: body.assets?.length });

      if (!body.assets || !Array.isArray(body.assets)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Campo "assets" deve ser um array',
            sync_id: syncId 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (body.assets.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Array "assets" não pode estar vazio',
            sync_id: syncId 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (body.assets.length > 100) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Máximo de 100 equipamentos por requisição',
            sync_id: syncId 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const mode = body.mode || 'upsert'; // upsert, insert_only, update_only
      const results: {
        success: Array<{ asset_code: string; action: string }>;
        failed: Array<{ asset_code: string; error: string }>;
        skipped: Array<{ asset_code: string; reason: string }>;
      } = {
        success: [],
        failed: [],
        skipped: [],
      };

      // Processar cada equipamento
      for (const assetData of body.assets) {
        try {
          const cleanPAT = assetData.asset_code?.replace(/\D/g, '').padStart(4, '0');
          
          if (!cleanPAT) {
            results.failed.push({ 
              asset_code: assetData.asset_code, 
              error: 'PAT inválido' 
            });
            continue;
          }

          // Verificar se existe
          const { data: existingAsset } = await supabase
            .from('assets')
            .select('id')
            .eq('asset_code', cleanPAT)
            .maybeSingle();

          const exists = !!existingAsset;

          // Decidir ação baseada no modo
          if (mode === 'insert_only' && exists) {
            results.skipped.push({ 
              asset_code: cleanPAT, 
              reason: 'Já existe (modo insert_only)' 
            });
            continue;
          }

          if (mode === 'update_only' && !exists) {
            results.skipped.push({ 
              asset_code: cleanPAT, 
              reason: 'Não existe (modo update_only)' 
            });
            continue;
          }

          // Executar operação (simplificado para bulk)
          if (!exists) {
            // Criar novo
            const locationType = assetData.location_type || 'deposito_malta';
            const newAssetData: any = {
              asset_code: cleanPAT,
              equipment_name: normalizeText(assetData.equipment_name || 'N/A'),
              manufacturer: normalizeText(assetData.manufacturer || 'N/A'),
              location_type: locationType,
              model: assetData.model ? normalizeText(assetData.model) : null,
            };

            const { error: insertError } = await supabase
              .from('assets')
              .insert(newAssetData);

            if (insertError) {
              results.failed.push({ 
                asset_code: cleanPAT, 
                error: insertError.message 
              });
            } else {
              results.success.push({ 
                asset_code: cleanPAT, 
                action: 'created' 
              });
            }
          } else {
            // Atualizar existente
            const updateData: any = {};
            if (assetData.equipment_name) updateData.equipment_name = normalizeText(assetData.equipment_name);
            if (assetData.manufacturer) updateData.manufacturer = normalizeText(assetData.manufacturer);
            if (assetData.model !== undefined) updateData.model = assetData.model ? normalizeText(assetData.model) : null;

            if (Object.keys(updateData).length > 0) {
              const { error: updateError } = await supabase
                .from('assets')
                .update(updateData)
                .eq('asset_code', cleanPAT);

              if (updateError) {
                results.failed.push({ 
                  asset_code: cleanPAT, 
                  error: updateError.message 
                });
              } else {
                results.success.push({ 
                  asset_code: cleanPAT, 
                  action: 'updated' 
                });
              }
            } else {
              results.skipped.push({ 
                asset_code: cleanPAT, 
                reason: 'Sem alterações' 
              });
            }
          }
        } catch (error) {
          results.failed.push({ 
            asset_code: assetData.asset_code, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          });
        }
      }

      console.log('Bulk operation completed:', results);

      return new Response(
        JSON.stringify({ 
          success: true,
          results,
          summary: {
            total: body.assets.length,
            success: results.success.length,
            failed: results.failed.length,
            skipped: results.skipped.length,
          },
          sync_id: syncId,
          timestamp: new Date().toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Endpoint não encontrado
    return new Response(
      JSON.stringify({ 
        error: 'Endpoint not found',
        available_endpoints: {
          create: 'POST /create - Criar novo equipamento',
          update: 'PUT /update/{asset_code} - Atualizar equipamento existente',
          move: 'PATCH /move/{asset_code} - Movimentar equipamento entre localizações',
          bulk: 'POST /bulk - Criar/atualizar múltiplos equipamentos (max 100)',
        },
        authentication: 'Include header: x-api-key: YOUR_N8N_API_KEY',
        documentation: 'https://github.com/your-repo/sync-assets-api-docs'
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync Assets API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
