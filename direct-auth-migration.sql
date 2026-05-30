-- WorkTrack Pro - Direct DB Authentication Migration
-- Creates a custom users table that bypasses Supabase Auth email rate limits
-- Stores users directly in public schema with bcrypt password hashing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom users table with password hash (client-side bcrypt)
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,  -- bcrypt hash from client
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'away', 'offline', 'suspended')),
    avatar TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users(role);

-- Enable RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public signup insert" ON public.app_users;
DROP POLICY IF EXISTS "Users can read own data" ON public.app_users;
DROP POLICY IF EXISTS "Users can update own data" ON public.app_users;
DROP POLICY IF EXISTS "Allow anon signup" ON public.app_users;

-- Policy: Allow anyone to insert (signup) - email uniqueness prevents duplicates
CREATE POLICY "Allow anon signup"
    ON public.app_users FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy: Allow anyone to read (needed for login verification)
CREATE POLICY "Allow read for login"
    ON public.app_users FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy: Users can update their own record
CREATE POLICY "Users can update own data"
    ON public.app_users FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = id::text);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_app_users_updated_at ON public.app_users;
CREATE TRIGGER update_app_users_updated_at
    BEFORE UPDATE ON public.app_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (anon needs access for signup/login)
GRANT SELECT, INSERT, UPDATE ON public.app_users TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_users TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Migrate existing profiles data if exists (run after setting up)
-- INSERT INTO public.app_users (id, email, full_name, role, status, created_at)
-- SELECT id, email, name, role, status, created_at FROM public.profiles
-- ON CONFLICT (email) DO NOTHING;
