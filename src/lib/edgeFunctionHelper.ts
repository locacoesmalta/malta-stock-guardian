import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InvokeFunctionOptions {
  functionName: string;
  body?: any;
  maxRetries?: number;
  retryDelay?: number;
  requiresAuth?: boolean;
}

export const invokeFunctionWithRetry = async ({
  functionName,
  body,
  maxRetries = 3,
  retryDelay = 1000,
  requiresAuth = true,
}: InvokeFunctionOptions) => {
  // ✅ Validar autenticação se necessário
  if (requiresAuth) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error("SESSÃO_EXPIRADA");
    }

    // Verificar se token não está próximo de expirar
    const expiresIn = session.expires_at ? (session.expires_at * 1000) - Date.now() : 0;
    if (expiresIn < 60000) { // Menos de 1 minuto
      console.log('[Edge Function Helper] Token próximo de expirar, renovando...');
      await supabase.auth.refreshSession();
      // Aguardar 1 segundo para garantir que o token foi renovado
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Edge Function] Chamando ${functionName} (tentativa ${attempt}/${maxRetries})`);
      
      const response = await supabase.functions.invoke(functionName, { body });
      
      // ✅ Validar resposta
      if (!response.data && !response.error) {
        throw new Error("RESPOSTA_VAZIA");
      }
      
      if (response.error) {
        // Se for erro 401 (não autorizado), não fazer retry
        if (response.error.message?.includes("401") || response.error.message?.includes("unauthorized")) {
          throw new Error("NÃO_AUTORIZADO");
        }
        throw response.error;
      }
      
      // Verificar se há erro no body da resposta
      if (response.data?.error) {
        // Se for erro de autenticação, não fazer retry
        if (response.data.error.includes("autorizado") || response.data.error.includes("autenticado")) {
          throw new Error("NÃO_AUTORIZADO");
        }
        throw new Error(response.data.error);
      }
      
      // ✅ Sucesso
      console.log(`[Edge Function] ${functionName} executada com sucesso`);
      return response.data;
      
    } catch (error: any) {
      lastError = error;
      console.error(`[Edge Function] Tentativa ${attempt} falhou:`, error);
      
      // Não fazer retry para erros de autenticação
      if (error.message?.includes("NÃO_AUTORIZADO") || error.message?.includes("SESSÃO_EXPIRADA")) {
        toast.error("Sessão expirada. Faça login novamente.");
        window.location.href = "/auth";
        throw error;
      }
      
      // Se não for a última tentativa, aguardar antes de tentar novamente
      if (attempt < maxRetries) {
        const delay = retryDelay * attempt; // Backoff exponencial
        console.log(`[Edge Function] Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // ✅ Se chegou aqui, todas as tentativas falharam
  console.error(`[Edge Function] Todas as ${maxRetries} tentativas falharam`);
  throw lastError;
};
