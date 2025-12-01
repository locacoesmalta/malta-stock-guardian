import { supabase } from "@/integrations/supabase/client";

/**
 * Cliente seguro para envio de webhooks via edge function
 * Todos os webhooks agora são enviados pelo backend para proteger URLs privadas
 */

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
  whatsapp: string;
  responsavel_malta: string;
  recebido_por_malta: string;
  itens: string;
  pdf_base64?: string;
}

/**
 * Envia webhook de erro via edge function
 */
export const sendErrorWebhook = async (payload: ErrorWebhookPayload): Promise<void> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-webhook', {
      body: {
        webhook_type: 'error',
        payload,
      },
    });

    if (error) {
      console.error('[webhookClient] Error sending error webhook:', error);
      throw error;
    }

    console.log('[webhookClient] Error webhook sent successfully');
  } catch (error) {
    console.error('[webhookClient] Failed to send error webhook:', error);
    // Não lançar erro para não afetar o fluxo principal
  }
};

/**
 * Envia webhook de recibo via edge function
 */
export const sendReceiptWebhook = async (
  payload: Omit<ReceiptWebhookPayload, 'pdf_base64'>,
  pdfBlob: Blob
): Promise<void> => {
  try {
    // Convert PDF blob to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
    });
    
    reader.readAsDataURL(pdfBlob);
    const pdf_base64 = await base64Promise;

    const { data, error } = await supabase.functions.invoke('send-webhook', {
      body: {
        webhook_type: 'receipt',
        payload: {
          ...payload,
          pdf_base64,
        },
      },
    });

    if (error) {
      console.error('[webhookClient] Error sending receipt webhook:', error);
      throw error;
    }

    console.log('[webhookClient] Receipt webhook sent successfully');
  } catch (error) {
    console.error('[webhookClient] Failed to send receipt webhook:', error);
    // Não lançar erro para não afetar o fluxo principal
  }
};