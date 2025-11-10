import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ErrorTrackingData {
  errorCode: string;
  errorType: string;
  message: string;
  stack?: string;
  additionalData?: Record<string, any>;
}

interface ErrorLogPayload {
  error_code: string;
  user_name: string | null;
  user_email: string | null;
  page_route: string;
  error_type: string;
  error_message: string;
  timestamp: string;
  additional_data?: Record<string, any>;
}

const WEBHOOK_URL = "https://webhook.7arrows.pro/webhook/erro";

const sendErrorToWebhook = async (payload: ErrorLogPayload) => {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    return response.ok;
  } catch (error) {
    console.error("Erro ao enviar para webhook:", error);
    return false;
  }
};

const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";
  
  // Detectar navegador
  if (ua.indexOf("Chrome") > -1) browser = "Chrome";
  else if (ua.indexOf("Safari") > -1) browser = "Safari";
  else if (ua.indexOf("Firefox") > -1) browser = "Firefox";
  else if (ua.indexOf("Edge") > -1) browser = "Edge";
  
  // Detectar OS
  if (ua.indexOf("Windows") > -1) os = "Windows";
  else if (ua.indexOf("Mac") > -1) os = "MacOS";
  else if (ua.indexOf("Linux") > -1) os = "Linux";
  else if (ua.indexOf("Android") > -1) os = "Android";
  else if (ua.indexOf("iOS") > -1) os = "iOS";
  
  return { browser, os, userAgent: ua };
};

export const useErrorTracking = () => {
  const { user } = useAuth();

  const logError = async ({
    errorCode,
    errorType,
    message,
    stack,
    additionalData = {},
  }: ErrorTrackingData): Promise<string | null> => {
    try {
      const currentRoute = window.location.pathname;
      const timestamp = new Date().toISOString();
      const browserInfo = getBrowserInfo();

      // Buscar informações do usuário se estiver autenticado
      let userName = null;
      let userEmail = null;
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();
        
        userName = profile?.full_name || null;
        userEmail = profile?.email || null;
      }

      // Combinar dados adicionais com informações do navegador
      const fullAdditionalData = {
        ...additionalData,
        ...browserInfo,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      };

      // Inserir no banco de dados
      const { data, error } = await supabase
        .from("error_logs")
        .insert({
          error_code: errorCode,
          user_id: user?.id || null,
          user_email: userEmail,
          user_name: userName,
          page_route: currentRoute,
          error_type: errorType,
          error_message: message,
          error_stack: stack || null,
          additional_data: fullAdditionalData,
          timestamp,
          webhook_sent: false,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Erro ao salvar log no banco:", error);
        return null;
      }

      // Enviar para webhook n8n
      const webhookPayload: ErrorLogPayload = {
        error_code: errorCode,
        user_name: userName,
        user_email: userEmail,
        page_route: currentRoute,
        error_type: errorType,
        error_message: message,
        timestamp,
        additional_data: fullAdditionalData,
      };

      const webhookSent = await sendErrorToWebhook(webhookPayload);

      // Atualizar flag de webhook enviado
      if (webhookSent && data?.id) {
        await supabase
          .from("error_logs")
          .update({
            webhook_sent: true,
            webhook_sent_at: new Date().toISOString(),
          })
          .eq("id", data.id);
      }

      return data?.id || null;
    } catch (error) {
      console.error("Erro crítico ao registrar erro:", error);
      return null;
    }
  };

  return { logError };
};
