-- Add must_change_password flag to user_permissions table
ALTER TABLE public.user_permissions 
ADD COLUMN must_change_password BOOLEAN DEFAULT false;

-- Users created by admin will need to change password on first login
-- Existing users will keep false (won't be forced to change)