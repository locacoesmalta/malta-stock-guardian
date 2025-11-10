-- Criar tabela de logs de erro
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_code TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_name TEXT,
  page_route TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  additional_data JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  webhook_sent BOOLEAN DEFAULT FALSE,
  webhook_sent_at TIMESTAMPTZ
);

-- Criar índices para performance
CREATE INDEX idx_error_logs_error_code ON public.error_logs(error_code);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX idx_error_logs_timestamp ON public.error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_webhook_sent ON public.error_logs(webhook_sent) WHERE webhook_sent = FALSE;

-- Habilitar RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins e superusers podem visualizar error logs"
  ON public.error_logs
  FOR SELECT
  USING (is_admin_or_superuser(auth.uid()));

CREATE POLICY "Sistema pode inserir error logs"
  ON public.error_logs
  FOR INSERT
  WITH CHECK (true);

-- Comentários na tabela
COMMENT ON TABLE public.error_logs IS 'Registro centralizado de erros do sistema com integração webhook';
COMMENT ON COLUMN public.error_logs.error_code IS 'Código padronizado: ERR-[MÓDULO]-[NÚMERO]';
COMMENT ON COLUMN public.error_logs.error_type IS 'Tipos: RUNTIME_ERROR, API_ERROR, AUTH_ERROR, VALIDATION_ERROR, etc';
COMMENT ON COLUMN public.error_logs.webhook_sent IS 'Flag indicando se o erro foi enviado para o webhook n8n';