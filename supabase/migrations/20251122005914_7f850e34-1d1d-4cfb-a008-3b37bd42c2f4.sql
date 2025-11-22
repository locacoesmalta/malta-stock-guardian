-- Habilitar realtime para a tabela audit_logs
-- Isso permite que a aplicação receba atualizações em tempo real quando novos logs são inseridos
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;