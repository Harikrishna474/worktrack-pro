-- Migration: Create delete_user_by_id function
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.delete_user_by_id(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Delete profile row first to avoid FK violations
  DELETE FROM public.profiles WHERE id = p_user_id;

  -- Delete the auth user using the postgres superuser context granted by SECURITY DEFINER
  -- This works because the function owner (postgres) has access to auth schema
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

-- Grant function ownership to postgres role so it can access auth.users
ALTER FUNCTION public.delete_user_by_id(UUID) OWNER TO postgres;

-- Revoke public access and only allow authenticated users to call this
REVOKE ALL ON FUNCTION public.delete_user_by_id(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_by_id(UUID) TO authenticated;
