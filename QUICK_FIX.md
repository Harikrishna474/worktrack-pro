# 🚀 Quick Fix: Create Database Tables

## The Problem
❌ Error: `Could not find the table 'public.tasks' in the schema cache`

## The Solution (2 minutes)

### 1. Open Supabase SQL Editor
🔗 https://app.supabase.com/project/cwizuqkyjzvyjhetbmxv/sql

### 2. Copy & Paste This SQL

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Review', 'Completed')),
    due_date TEXT,
    assignees TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'Operations',
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can manage their own projects"
    ON public.projects
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for tasks
CREATE POLICY "Users can manage their own tasks"
    ON public.tasks
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### 3. Click "Run" (or press Cmd+Enter)

### 4. Test Your App
✅ Now try adding a task again - it should work!

---

**For the complete schema with all features, use `supabase-schema.sql` instead.**
