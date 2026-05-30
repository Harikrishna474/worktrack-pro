-- WorkTrack Pro - Users/Profiles Table Migration
-- Run this to create the public.users table for admin user management

-- Create profiles table (stores public user data)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'away', 'offline')),
    last_active TEXT DEFAULT 'Just now',
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Allow authenticated users to view all profiles (needed for admin)
CREATE POLICY "Users can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Admins can do everything (using service role or direct SQL for now)
-- For full admin support, use service role key in backend functions

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role, status)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email,
        'user',
        'active'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_profile();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing auth.users to profiles (run this if you have existing users)
INSERT INTO public.profiles (id, name, email, role, status)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'name', email),
    email,
    'user',
    'active'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- To set a user as admin, run this after they sign up:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'user@example.com';
