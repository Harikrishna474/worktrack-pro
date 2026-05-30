export type View = 'dashboard' | 'tasks' | 'reports' | 'admin' | 'login' | 'reset-password';

export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  name?: string; // Legacy field for backward compatibility
  full_name?: string; // Database field name (app_users table)
  email: string;
  role: UserRole;
  status: 'active' | 'away' | 'offline';
  lastActive?: string;
  last_active?: string;
  avatar: string;
  created_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'In Progress' | 'Review' | 'To Do' | 'Completed';
  dueDate: string;
  assignees: string[];
  category: string;
  project_id?: string; // Map project tracking for Supabase
}

export interface Assignee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at?: string;
  user_id?: string;
}

export interface AccessLog {
  id: string;
  type: 'success' | 'error' | 'export';
  title: string;
  time: string;
  description: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
}
