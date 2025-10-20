-- Apply must_change_password to existing users, except the first admin (superadmin)
-- The first user created is always the superadmin

-- First, find the first admin user (the oldest one)
WITH first_admin AS (
  SELECT user_id 
  FROM user_roles 
  WHERE role = 'admin' 
  ORDER BY created_at ASC 
  LIMIT 1
)
-- Update all users except the first admin
UPDATE user_permissions
SET must_change_password = true
WHERE user_id NOT IN (SELECT user_id FROM first_admin)
  AND must_change_password = false;