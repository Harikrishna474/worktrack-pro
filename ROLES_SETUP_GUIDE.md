# 🔐 User Roles Setup Guide

## Problem Fixed
The error `infinite recursion detected in policy for relation "user_roles"` has been resolved.

## Quick Fix (Run This Now)

### Step 1: Fix the Recursion Error

1. Go to your Supabase SQL Editor: https://app.supabase.com/project/cwizuqkyjzvyjhetbmxv/sql
2. Copy and paste the contents of `fix-roles-recursion.sql`
3. Click **Run**

This will remove the problematic policies and create simple, working ones.

### Step 2: Make Yourself an Admin

1. In the same SQL Editor, run this query (replace with your email):

```sql
-- Check your user ID and current role
SELECT 
    u.id,
    u.email,
    ur.role as current_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your@email.com';
```

2. Then run this to make yourself admin:

```sql
-- Make yourself admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'your@email.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

3. Verify it worked:

```sql
-- Verify you're now admin
SELECT u.email, ur.role 
FROM auth.users u 
LEFT JOIN public.user_roles ur ON u.id = ur.user_id 
WHERE u.email = 'your@email.com';
```

### Step 3: Test in Your App

1. Refresh your app
2. Log out and log back in
3. You should now see the **Admin** menu item in the sidebar!

---

## How It Works

### User Roles

The system supports 3 roles:
- **`admin`** - Full access including Admin panel
- **`manager`** - Access to Dashboard, Tasks, and Reports
- **`user`** - Access to Dashboard, Tasks, and Reports (default)

### What Changed

**Before (Broken):**
- RLS policy tried to check `user_roles` table while querying `user_roles` table
- This created infinite recursion

**After (Fixed):**
- Simple policy: users can only see their own role
- No recursive checks
- Admin management done via SQL or Supabase Dashboard

### Database Schema

The `user_roles` table:
```sql
- id (UUID)
- user_id (UUID) - links to auth.users
- role (TEXT) - 'admin', 'manager', or 'user'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Automatic Role Assignment

When a new user signs up:
1. Trigger automatically creates a `user_roles` entry
2. Default role is set to `'user'`
3. Admins must manually promote users to `admin` or `manager`

---

## Managing User Roles

### View All Users and Their Roles

```sql
SELECT 
    u.email,
    COALESCE(ur.role, 'no role') as role,
    u.created_at as joined_date
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;
```

### Promote User to Admin

```sql
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

### Promote User to Manager

```sql
UPDATE public.user_roles 
SET role = 'manager' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

### Demote User to Regular User

```sql
UPDATE public.user_roles 
SET role = 'user' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
```

### Check Your Own Role

```sql
SELECT u.email, ur.role 
FROM auth.users u 
LEFT JOIN public.user_roles ur ON u.id = ur.user_id 
WHERE u.id = auth.uid();
```

---

## Troubleshooting

### "Admin menu still not showing"

1. **Clear browser cache** and refresh
2. **Log out and log back in** to refresh the session
3. **Check your role in database:**
   ```sql
   SELECT email, role FROM auth.users u 
   JOIN user_roles ur ON u.id = ur.user_id 
   WHERE email = 'your@email.com';
   ```
4. **Check browser console** (F12) for any errors

### "User has no role entry"

If a user signed up before the trigger was created:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user' FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_roles);
```

### "Still getting recursion error"

Make sure you ran `fix-roles-recursion.sql` completely. Check existing policies:

```sql
SELECT * FROM pg_policies WHERE tablename = 'user_roles';
```

Should only show 2 policies:
- "Users can view their own role"
- "Users can insert their own role"

---

## Security Notes

### Why No Admin Policy in RLS?

To avoid infinite recursion, we don't use RLS policies that check the `user_roles` table from within `user_roles` queries.

**Admin management is done via:**
1. Direct SQL queries (as shown above)
2. Supabase Dashboard (Table Editor)
3. Service role API calls (backend only)

### Is This Secure?

**Yes!** Here's why:
- Users can only see their own role (RLS enforced)
- Users cannot change their own role (no UPDATE policy for regular users)
- Only database admins (you) can change roles via SQL
- The app checks roles on the frontend for UI display
- Backend/API should also verify roles for sensitive operations

### Best Practices

1. **Keep admin count low** - Only promote trusted users
2. **Use manager role** for team leads who need visibility but not full admin access
3. **Audit role changes** - Check the `updated_at` timestamp in `user_roles`
4. **Regular reviews** - Periodically review who has admin access

---

## Quick Reference Commands

```sql
-- Make user admin
UPDATE user_roles SET role = 'admin' WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');

-- View all admins
SELECT u.email FROM auth.users u JOIN user_roles ur ON u.id = ur.user_id WHERE ur.role = 'admin';

-- Count users by role
SELECT role, COUNT(*) FROM user_roles GROUP BY role;

-- Remove admin access
UPDATE user_roles SET role = 'user' WHERE user_id = (SELECT id FROM auth.users WHERE email = 'former-admin@example.com');
```

---

## Need Help?

If you're still having issues:
1. Check the browser console for errors
2. Verify the SQL was executed successfully
3. Make sure you're logged in with the correct account
4. Try logging out and back in
