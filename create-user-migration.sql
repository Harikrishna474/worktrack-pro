-- Migration: Fix profiles RLS + create admin_insert_profile function
-- Run this in your Supabase SQL Editor

-- 1. Ensure RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop any conflicting policies first
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 3. Allow all authenticated users to read profiles (needed for user lists)
CREATE POLICY "Users can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- 4. Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 5. Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- 6. Allow admins to delete any profile
CREATE POLICY "Admins can delete any profile"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- 7. Create a SECURITY DEFINER function that:
--    a) Inserts into auth.users (satisfies FK constraint)
--    b) Inserts into public.profiles
--    Owned by postgres so it has access to auth schema
CREATE OR REPLACE FUNCTION public.admin_create_user(
    p_name TEXT,
    p_email TEXT,
    p_role TEXT,
    p_status TEXT,
    p_avatar TEXT,
    p_last_active TEXT
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_pw TEXT;
BEGIN
    v_user_id := gen_random_uuid();
    -- Use pgcrypto (enabled via otp-reset-migration) with fully-qualified schema
    v_encrypted_pw := public.crypt(gen_random_uuid()::TEXT, public.gen_salt('bf'));

    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        aud
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        p_email,
        v_encrypted_pw,
        NOW(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('name', p_name),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );

    -- Trigger handle_new_user_profile already inserted a profile row on auth.users insert.
    -- Update it with the admin-specified values.
    RETURN QUERY
    UPDATE public.profiles
    SET
        name        = p_name,
        email       = p_email,
        role        = p_role,
        status      = p_status,
        avatar      = p_avatar,
        last_active = p_last_active
    WHERE id = v_user_id
    RETURNING *;
END;
$$;

ALTER FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
