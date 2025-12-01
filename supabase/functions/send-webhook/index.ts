import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ErrorWebhookPayload {
  error_code: string;
  user_name: string;
  user_email: string;
  page_route: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  timestamp: string;
  additional_data?: any;
}

interface ReceiptWebhookPayload {
  numero_recibo: string;
  tipo_recibo: string;
  cliente: string;
  obra: string;
  data: string;
  natureza_operacao: string;
  recebido_por: string;
  cpf: string;
  whatsapp: string;
  responsavel_malta: string;
  recebido_por_malta: string;
  itens: string;
  pdf: Blob;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client for auth validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('[send-webhook] Request from user:', user.id);

    // Parse request
    const contentType = req.headers.get('content-type');
    const { webhook_type, payload } = await req.json();

    console.log('[send-webhook] Webhook type:', webhook_type);

    if (!webhook_type || !payload) {
      throw new Error('Missing webhook_type or payload');
    }

    // Get webhook URL from secrets based on type
    let webhookUrl: string;
    
    if (webhook_type === 'error') {
      webhookUrl = Deno.env.get('WEBHOOK_ERROR_URL')!;
      
      if (!webhookUrl) {
        throw new Error('WEBHOOK_ERROR_URL not configured');
      }

      // Send error webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload as ErrorWebhookPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[send-webhook] Error response:', errorText);
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      console.log('[send-webhook] Error webhook sent successfully');

      return new Response(
        JSON.stringify({ success: true, message: 'Error webhook sent' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } else if (webhook_type === 'receipt') {
      webhookUrl = Deno.env.get('WEBHOOK_RECEIPT_URL')!;
      
      if (!webhookUrl) {
        throw new Error('WEBHOOK_RECEIPT_URL not configured');
      }

      // For receipt, we need to handle FormData
      // The payload should contain all the data including the PDF blob
      const formData = new FormData();
      
      // Add all text fields
      Object.entries(payload).forEach(([key, value]) => {
        if (key !== 'pdf' && value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // The PDF blob should be sent separately in the request
      // This edge function expects the PDF to be sent as base64 in the payload
      if (payload.pdf_base64) {
        // Convert base64 to blob
        const pdfBytes = Uint8Array.from(atob(payload.pdf_base64), c => c.charCodeAt(0));
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        formData.append('pdf', pdfBlob, 'receipt.pdf');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[send-webhook] Receipt webhook error:', errorText);
        throw new Error(`Receipt webhook failed with status ${response.status}`);
      }

      console.log('[send-webhook] Receipt webhook sent successfully');

      return new Response(
        JSON.stringify({ success: true, message: 'Receipt webhook sent' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } else {
      throw new Error(`Unknown webhook type: ${webhook_type}`);
    }

  } catch (error) {
    console.error('[send-webhook] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});