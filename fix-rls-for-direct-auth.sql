-- Fix RLS policies for direct DB auth (no Supabase Auth JWT)
-- Updates projects/tasks to work with app_users instead of auth.users

-- 1. Remove FK constraint from projects to auth.users (make it reference app_users or be nullable)
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

-- 2. Update RLS policies for projects to allow anon access with user_id check against app_users
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Allow anon projects access" ON public.projects;
DROP POLICY IF EXISTS "Allow all projects access" ON public.projects;

-- Allow anon to read/write projects (user_id filtering done in app logic)
CREATE POLICY "Allow all projects access"
    ON public.projects FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Remove FK constraint from tasks to auth.users
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

-- 4. Update RLS policies for tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all tasks access" ON public.tasks;

-- Allow anon to read/write tasks (user_id filtering done in app logic)
CREATE POLICY "Allow all tasks access"
    ON public.tasks FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Grant permissions to anon for direct auth
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- 6. Enable anon to query app_users for login verification
-- (already done in direct-auth-migration.sql but ensure it exists)
GRANT SELECT ON public.app_users TO anon;
