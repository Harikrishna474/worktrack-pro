-- Migration: Fix delete user for app_users table
-- Run this in your Supabase SQL Editor

-- 1. Add DELETE policy for app_users (allow admin/any authenticated to delete)
DROP POLICY IF EXISTS "Allow delete user" ON public.app_users;

CREATE POLICY "Allow delete user"
    ON public.app_users FOR DELETE
    TO anon, authenticated
    USING (true);

-- 2. Update delete_user_by_id function to work with app_users
CREATE OR REPLACE FUNCTION public.delete_user_by_id(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete from app_users table directly
  DELETE FROM public.app_users WHERE id = p_user_id;
END;
$$;

-- Grant execute permissions
ALTER FUNCTION public.delete_user_by_id(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.delete_user_by_id(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_by_id(UUID) TO anon, authenticated;

-- 3. Also add direct delete permission to anon
GRANT DELETE ON public.app_users TO anon;
GRANT DELETE ON public.app_users TO authenticated;
