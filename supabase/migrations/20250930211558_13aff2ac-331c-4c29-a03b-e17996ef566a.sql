-- Criar trigger para ativar automaticamente novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_auto_activate()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o registro de permissões para ativar automaticamente o usuário
  UPDATE public.user_permissions
  SET is_active = true
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que será executado após inserção na tabela auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created_auto_activate
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_auto_activate();

-- Ativar todos os usuários existentes que ainda não estão ativos
UPDATE public.user_permissions
SET is_active = true
WHERE is_active = false;