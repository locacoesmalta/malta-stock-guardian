-- Desativar cron jobs de user_presence que estão rodando sem necessidade
-- (hook de presença está desativado no frontend)
SELECT cron.unschedule(2);
SELECT cron.unschedule(3);