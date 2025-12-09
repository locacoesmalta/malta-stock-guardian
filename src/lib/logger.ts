import { supabase } from "@/integrations/supabase/client";
import { getISOStringInBelem } from "@/lib/dateUtils";

type LogCategory = 'AUTH' | 'SESSION' | 'PERMISSION' | 'SYSTEM' | 'ERROR';

interface LogData {
  [key: string]: any;
}

class Logger {
  private isDev = import.meta.env.DEV;
  private isProd = import.meta.env.PROD;

  private formatMessage(category: LogCategory, message: string, data?: LogData): string {
    const timestamp = getISOStringInBelem();
    return `[${category} ${timestamp}] ${message}`;
  }

  auth(message: string, data?: LogData) {
    const formatted = this.formatMessage('AUTH', message, data);
    console.log(formatted, data || '');
    
    // Em produção, salvar logs críticos de autenticação
    if (this.isProd && (message.includes('error') || message.includes('failed'))) {
      this.persistLog('AUTH', message, data);
    }
  }

  session(message: string, data?: LogData) {
    const formatted = this.formatMessage('SESSION', message, data);
    console.log(formatted, data || '');
    
    // Salvar logs de sessão problemáticos
    if (message.includes('corrupted') || message.includes('failed') || message.includes('stale')) {
      this.persistLog('SESSION', message, data);
    }
  }

  permission(message: string, data?: LogData) {
    const formatted = this.formatMessage('PERMISSION', message, data);
    console.log(formatted, data || '');
    
    // Salvar mudanças de permissão
    if (message.includes('updated') || message.includes('changed')) {
      this.persistLog('PERMISSION', message, data);
    }
  }

  system(message: string, data?: LogData) {
    const formatted = this.formatMessage('SYSTEM', message, data);
    console.log(formatted, data || '');
  }

  error(message: string, error: any, additionalData?: LogData) {
    const formatted = this.formatMessage('ERROR', message);
    console.error(formatted, error, additionalData || '');
    
    // Sempre salvar erros
    this.persistError(message, error, additionalData);
  }

  private async persistLog(category: LogCategory, message: string, data?: LogData) {
    try {
      // Tentar obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      // Salvar no audit_logs
      await supabase.from('audit_logs').insert({
        action: `${category}_LOG`,
        user_email: user?.email || 'system',
        user_id: user?.id,
        new_data: {
          category,
          message,
          data: data || null,
          timestamp: getISOStringInBelem(),
        },
      });
    } catch (err) {
      // Falhar silenciosamente para não atrapalhar a aplicação
      console.warn('[LOGGER] Failed to persist log:', err);
    }
  }

  private async persistError(message: string, error: any, additionalData?: LogData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('error_logs').insert({
        error_type: 'SYSTEM_ERROR',
        error_message: message,
        error_code: 'ERR-SYSTEM-500',
        error_stack: error?.stack || JSON.stringify(error),
        user_id: user?.id,
        user_email: user?.email,
        page_route: window.location.pathname,
        additional_data: additionalData || null,
        timestamp: getISOStringInBelem(),
      });
    } catch (err) {
      console.warn('[LOGGER] Failed to persist error:', err);
    }
  }
}

export const logger = new Logger();
