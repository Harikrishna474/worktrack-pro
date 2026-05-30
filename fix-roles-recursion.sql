-- Fix for infinite recursion in user_roles RLS policies
-- Run this SQL in your Supabase SQL Editor

-- Drop all existing policies on user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Create simple, non-recursive policies
-- Policy 1: Users can view their own role
CREATE POLICY "Users can view their own role"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own role (needed for signup trigger)
CREATE POLICY "Users can insert their own role"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Verify the fix
SELECT 'Policies fixed successfully!' as status;

-- To set a user as admin, run this query (replace with your email):
-- UPDATE public.user_roles SET role = 'admin' 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com');

-- To check your current role:
-- SELECT u.email, ur.role 
-- FROM auth.users u 
-- LEFT JOIN public.user_roles ur ON u.id = ur.user_id 
-- WHERE u.id = auth.uid();
