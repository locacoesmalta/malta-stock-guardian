import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getISOStringInBelem } from "@/lib/dateUtils";

interface ErrorContext {
  acao?: string; // Ex: "Movimentando equipamento", "Criando relatório"
  categoria?: "MOVIMENTACAO" | "ESTOQUE" | "RELATORIO" | "ADMIN" | "AUTH" | "SISTEMA";
  entidade?: {
    tipo: string; // Ex: "asset", "product", "report"
    id?: string;
    codigo?: string; // Ex: PAT "0234"
  };
  dadoProblematico?: Record<string, any>; // Campo/valor que causou erro
  descricaoAmigavel?: string; // Mensagem clara para usuário entender
}

interface ErrorTrackingData {
  errorCode: string;
  errorType: string;
  message: string;
  stack?: string;
  additionalData?: Record<string, any>;
  contexto?: ErrorContext;
}

interface ErrorLogPayload {
  error_code: string;
  user_name: string | null;
  user_email: string | null;
  user_whatsapp: string | null;
  page_route: string;
  error_type: string;
  error_message: string;
  severity_level: string;
  timestamp: string;
  formatted_message: string;
  notification_type: string;
  evolution_api: {
    instance: string;
    message_type: string;
    priority: string;
    schedule_send: boolean;
  };
  additional_data?: Record<string, any>;
}

const sendErrorToWebhook = async (payload: ErrorLogPayload) => {
  try {
    const { sendErrorWebhook } = await import("@/lib/webhookClient");
    await sendErrorWebhook({
      error_code: payload.error_code,
      user_name: payload.user_name || "Unknown",
      user_email: payload.user_email || "unknown@unknown.com",
      page_route: payload.page_route,
      error_type: payload.error_type,
      error_message: payload.error_message,
      error_stack: payload.additional_data?.stack || undefined,
      timestamp: payload.timestamp,
      additional_data: payload.additional_data,
    });
    
    return true;
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

const calculateSeverity = (errorCode: string, errorType: string): string => {
  // Erros críticos que exigem ação imediata
  if (errorCode.includes('CRITICAL') || errorType.includes('FATAL')) {
    return 'CRITICAL';
  }
  
  // Erros de autenticação e segurança
  if (errorType.includes('AUTH') || errorType.includes('SECURITY')) {
    return 'HIGH';
  }
  
  // Erros de runtime e validação
  if (errorType.includes('RUNTIME') || errorCode.startsWith('ERR-RUNTIME')) {
    return 'HIGH';
  }
  
  // Erros de rede e API
  if (errorType.includes('NETWORK') || errorType.includes('API')) {
    return 'MEDIUM';
  }
  
  // Erros de validação e teste
  if (errorType.includes('VALIDATION') || errorType === 'TEST_ERROR') {
    return 'LOW';
  }
  
  return 'MEDIUM';
};

const formatWhatsAppMessage = (data: {
  errorCode: string;
  userName: string | null;
  pageRoute: string;
  errorMessage: string;
  timestamp: string;
  severityLevel: string;
}): string => {
  const time = new Date(data.timestamp).toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const date = new Date(data.timestamp).toLocaleDateString('pt-BR');
  
  const severityEmoji = {
    CRITICAL: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🟢'
  }[data.severityLevel] || '⚪';
  
  const pageNames: Record<string, string> = {
    '/admin/settings': 'Configurações',
    '/admin/users': 'Usuários',
    '/admin/products': 'Produtos',
    '/assets': 'Patrimônios',
    '/assets/new': 'Cadastro de Patrimônio',
    '/reports': 'Relatórios',
  };
  
  const pageName = pageNames[data.pageRoute] || data.pageRoute;
  
  return `🚨 *Erro Detectado no Sistema*

${severityEmoji} *Severidade:* ${data.severityLevel}
📋 *Código:* ${data.errorCode}
👤 *Usuário:* ${data.userName || 'Anônimo'}
📍 *Página:* ${pageName}
📅 *Data:* ${date}
⏰ *Horário:* ${time}

❌ *Mensagem:*
${data.errorMessage}

🔗 *Ver detalhes:*
https://controlemalta.lovable.app/admin/error-logs`;
};

const getNotificationType = (severityLevel: string): string => {
  if (severityLevel === 'CRITICAL' || severityLevel === 'HIGH') {
    return 'immediate';
  }
  
  if (severityLevel === 'MEDIUM') {
    return 'batch';
  }
  
  return 'none';
};

export const useErrorTracking = () => {
  const { user } = useAuth();

  const logError = async ({
    errorCode,
    errorType,
    message,
    stack,
    additionalData = {},
    contexto,
  }: ErrorTrackingData): Promise<string | null> => {
    try {
      const currentRoute = window.location.pathname;
      const timestamp = getISOStringInBelem();
      const browserInfo = getBrowserInfo();

      // Buscar informações do usuário se estiver autenticado
      let userName = null;
      let userEmail = null;
      let userWhatsApp = null;
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();
        
        userName = profile?.full_name || null;
        userEmail = profile?.email || null;
        
        // Buscar WhatsApp do usuário (assumindo que existe um campo whatsapp na tabela profiles)
        // Se não existir, você pode adicionar esse campo posteriormente
        userWhatsApp = null; // TODO: Adicionar campo whatsapp na tabela profiles
      }

      // Calcular severidade e tipo de notificação
      const severityLevel = calculateSeverity(errorCode, errorType);
      const notificationType = getNotificationType(severityLevel);
      
      // Formatar mensagem para WhatsApp
      const formattedMessage = formatWhatsAppMessage({
        errorCode,
        userName,
        pageRoute: currentRoute,
        errorMessage: message,
        timestamp,
        severityLevel,
      });

      // Combinar dados adicionais com informações do navegador e contexto
      const fullAdditionalData = {
        ...additionalData,
        ...browserInfo,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        // Adicionar contexto se fornecido
        ...(contexto && {
          contexto_acao: contexto.acao,
          categoria: contexto.categoria,
          entidade_tipo: contexto.entidade?.tipo,
          entidade_id: contexto.entidade?.id,
          entidade_codigo: contexto.entidade?.codigo,
          dado_problematico: contexto.dadoProblematico,
          descricao_amigavel: contexto.descricaoAmigavel,
        }),
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

      // Enviar para webhook n8n com payload enriquecido
      const webhookPayload = {
        error_code: errorCode,
        user_name: userName,
        user_email: userEmail,
        user_whatsapp: userWhatsApp,
        page_route: currentRoute,
        error_type: errorType,
        error_message: message,
        severity_level: severityLevel,
        timestamp,
        formatted_message: formattedMessage,
        notification_type: notificationType,
        evolution_api: {
          instance: "malta_locacoes",
          message_type: "text",
          priority: severityLevel === 'CRITICAL' || severityLevel === 'HIGH' ? 'high' : 'normal',
          schedule_send: false,
        },
        additional_data: fullAdditionalData,
      };

      const webhookSent = await sendErrorToWebhook(webhookPayload);

      // Atualizar flag de webhook enviado
      if (webhookSent && data?.id) {
        await supabase
          .from("error_logs")
          .update({
            webhook_sent: true,
            webhook_sent_at: getISOStringInBelem(),
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
