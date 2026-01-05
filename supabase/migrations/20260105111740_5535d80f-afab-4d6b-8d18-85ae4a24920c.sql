-- Liberar can_access_admin para TODOS os usuários ativos existentes
-- Isso dará acesso às rotas /admin/* operacionais (Produtos, Caixa, Logs, etc.)
-- Páginas críticas (/admin/users, /admin/external-sync) continuam protegidas por OwnerOnlyRoute

UPDATE user_permissions
SET can_access_admin = true
WHERE is_active = true;