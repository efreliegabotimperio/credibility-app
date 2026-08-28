-- Run this script in the Supabase SQL Editor to create the delete RPC function
-- This allows superadmins to permanently delete users and cascade the deletion 
-- across related tables, including sops.

CREATE OR REPLACE FUNCTION delete_admin_user(target_user_id uuid)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the requesting user is a superadmin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Not authorized to delete users';
  END IF;

  -- 1. Delete user activity logs
  DELETE FROM activity_logs WHERE user_id = target_user_id;
  
  -- 2. Delete user's SOPs
  DELETE FROM sops WHERE user_id = target_user_id;

  -- 3. Delete user roles
  DELETE FROM user_roles WHERE user_id = target_user_id;

  -- 4. Delete user profile (if it doesn't automatically cascade)
  DELETE FROM profiles WHERE id = target_user_id;
  
  -- 5. Finally, delete the actual authentication user 
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql;
