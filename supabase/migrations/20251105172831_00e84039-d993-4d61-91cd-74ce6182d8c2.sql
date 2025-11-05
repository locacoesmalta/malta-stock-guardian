-- FASE 1: Adicionar 'superuser' ao enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'superuser';