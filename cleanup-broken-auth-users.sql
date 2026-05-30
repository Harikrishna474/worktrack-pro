-- Cleanup: Remove broken auth users created by failed admin_create_user attempts
-- Run this in Supabase SQL Editor to restore login/signup functionality

-- Step 1: Remove auth users that have no matching profile
-- (these are the broken partial rows from failed function executions)
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
  AND raw_app_meta_data->>'provider' = 'email'
  AND created_at > NOW() - INTERVAL '1 hour';

-- Step 2: Remove orphaned profiles with no auth user (safety cleanup)
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- Step 3: Remove orphaned user_roles with no auth user (safety cleanup)
DELETE FROM public.user_roles
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 4: Verify - should show all remaining auth users have profiles
SELECT 
    u.id,
    u.email,
    u.created_at,
    p.name,
    p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 20;
