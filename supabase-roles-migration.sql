-- WorkTrack Pro - User Roles Migration
-- Run this SQL AFTER the main schema to add role-based access control

-- Create user_roles table to store user role information
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- RLS Policies for user_roles table
-- Allow all authenticated users to view their own role (no recursion)
CREATE POLICY "Users can view their own role"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow system to insert roles (for new user trigger)
CREATE POLICY "Users can insert their own role"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Note: Admin management should be done via service role or direct SQL
-- To avoid infinite recursion, we don't create policies that check user_roles within user_roles
-- Instead, use the Supabase dashboard or service role to manage admin users

-- Create function to automatically assign default role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to assign role when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = user_uuid AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is manager or admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = user_uuid AND role IN ('admin', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger for user_roles
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;

-- Optional: Create your first admin user
-- Replace 'YOUR_USER_EMAIL@example.com' with your actual email
-- Run this AFTER you've signed up in the app

-- IMPORTANT: Uncomment and modify the line below with your email after signing up
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'YOUR_USER_EMAIL@example.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- To manually set a user as admin, use this query:
-- UPDATE public.user_roles SET role = 'admin' WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com');

-- To check all users and their roles:
-- SELECT u.email, ur.role, ur.created_at 
-- FROM auth.users u 
-- LEFT JOIN public.user_roles ur ON u.id = ur.user_id 
-- ORDER BY ur.created_at DESC;
