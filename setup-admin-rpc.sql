-- Run this script in the Supabase SQL Editor to create the RPC function
-- This allows the frontend to fetch the user list with confirmation status securely.

CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
  is_verified boolean
)
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the requesting user is a superadmin or admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'superadmin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    COALESCE(r.role, 'owner') AS role,
    (au.email_confirmed_at IS NOT NULL) AS is_verified
  FROM profiles p
  LEFT JOIN user_roles r ON p.id = r.user_id
  LEFT JOIN auth.users au ON p.id = au.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
