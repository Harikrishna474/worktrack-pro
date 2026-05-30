# Database Setup Guide for WorkTrack Pro

## Problem
You're getting the error: `Could not find the table 'public.tasks' in the schema cache`

This means the database tables haven't been created in your Supabase project yet.

## Solution: Create the Database Tables

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project (the one with URL: `https://cwizuqkyjzvyjhetbmxv.supabase.co`)
3. Click on **SQL Editor** in the left sidebar (or go to: https://app.supabase.com/project/cwizuqkyjzvyjhetbmxv/sql)

### Step 2: Run the Schema SQL

1. Click **"New Query"** button
2. Copy the entire contents of `supabase-schema.sql` file (in this directory)
3. Paste it into the SQL editor
4. Click **"Run"** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

### Step 3: Verify Tables Were Created

After running the SQL, verify the tables exist:

1. Click on **"Table Editor"** in the left sidebar
2. You should see two new tables:
   - `projects`
   - `tasks`

### Step 4: Test the Application

1. Restart your development server if it's running
2. Log in to the application
3. Click **"Add New Task"**
4. Fill in the form and submit
5. The task should now be saved successfully!

## What the Schema Creates

### Tables

1. **`projects`** - Stores project/category information
   - `id` (UUID, primary key)
   - `name` (text)
   - `description` (text)
   - `user_id` (UUID, links to authenticated user)
   - `created_at`, `updated_at` (timestamps)

2. **`tasks`** - Stores all task information
   - `id` (UUID, primary key)
   - `title` (text, required)
   - `description` (text)
   - `priority` ('low', 'medium', 'high')
   - `status` ('To Do', 'In Progress', 'Review', 'Completed')
   - `due_date` (text)
   - `assignees` (text array)
   - `category` (text)
   - `project_id` (UUID, links to projects table)
   - `user_id` (UUID, links to authenticated user)
   - `created_at`, `updated_at` (timestamps)

### Security Features

- **Row Level Security (RLS)** enabled on both tables
- Users can only see/edit their own tasks and projects
- Automatic timestamps for created_at and updated_at
- Proper foreign key relationships
- Indexes for better query performance

## Troubleshooting

### If you still get errors after running the SQL:

1. **Check if tables exist:**
   - Go to Table Editor in Supabase
   - Look for `projects` and `tasks` tables

2. **Check RLS policies:**
   - Go to Authentication → Policies
   - Verify policies exist for both tables

3. **Check your authentication:**
   - Make sure you're logged in with a valid Supabase account
   - Check browser console for any auth errors

4. **Refresh the schema cache:**
   - In Supabase Dashboard, go to Settings → API
   - Click "Reload schema cache"

### If you want to start fresh:

Run this SQL to drop and recreate everything:

```sql
-- Drop tables (this will delete all data!)
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- Then run the full supabase-schema.sql again
```

## Next Steps

Once the database is set up:
- ✅ Tasks will be saved to Supabase
- ✅ Tasks will persist across sessions
- ✅ Each user will only see their own tasks
- ✅ Projects will be automatically created when needed

## Need Help?

If you encounter any issues:
1. Check the browser console for detailed error messages
2. Check the Supabase logs in Dashboard → Logs
3. Verify your `.env` file has the correct credentials
