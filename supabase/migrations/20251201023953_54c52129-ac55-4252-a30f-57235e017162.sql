-- Remove cron job redundante cleanup-stale-sessions-hourly
-- Os jobs de limpeza direta no banco (user_presence cleanup) já fazem esse trabalho

SELECT cron.unschedule('cleanup-stale-sessions-hourly');