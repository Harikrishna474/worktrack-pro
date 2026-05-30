-- Make a user an admin
-- Replace 'YOUR_EMAIL@example.com' with your actual email address

-- Step 1: Check if user exists and see their current role
SELECT 
    u.id,
    u.email,
    ur.role as current_role,
    ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'YOUR_EMAIL@example.com';

-- Step 2: Update user to admin role (uncomment and modify email)
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com');

-- Step 3: If user doesn't have a role entry yet, insert one (uncomment and modify email)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'YOUR_EMAIL@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Step 4: Verify the change
SELECT 
    u.email,
    ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'YOUR_EMAIL@example.com';

-- Quick reference: View all users and their roles
SELECT 
    u.email,
    COALESCE(ur.role, 'no role assigned') as role,
    u.created_at as user_created
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;
