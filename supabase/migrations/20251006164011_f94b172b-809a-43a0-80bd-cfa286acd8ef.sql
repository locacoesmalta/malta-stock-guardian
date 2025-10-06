-- Atualizar usuários específicos para serem administradores
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE email IN ('alan@malta.com', 'everton@malta.com', 'filipe@malta.com')
);