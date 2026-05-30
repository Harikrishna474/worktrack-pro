import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Reports from './components/Reports';
import Admin from './components/Admin';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import NewTaskModal from './components/NewTaskModal';
import { Task, Project } from './types';
import { MOCK_TASKS } from './constants';
import { supabase, isSupabaseConfigured } from './utils/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface AppContextType {
  currentUser: any;
  setCurrentUser: (user: any) => void;
  authReady: boolean;
  userRole: 'admin' | 'manager' | 'user';
  setUserRole: (role: 'admin' | 'manager' | 'user') => void;
  tasks: Task[];
  projects: Project[];
  isModalOpen: boolean;
  setIsModalOpen: (v: boolean) => void;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTaskStatus: (id: string, status: Task['status']) => Promise<void>;
  updateTaskPriority: (id: string, priority: Task['priority']) => Promise<void>;
  updateTaskAssignees: (id: string, assignees: string[]) => Promise<void>;
  handleLogout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => useContext(AppContext)!;

function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'user'>('user');
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for direct auth session in localStorage first
    const storedUser = localStorage.getItem('worktrack_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        const role = user.user_metadata?.role || 'user';
        setUserRole(role as 'admin' | 'manager' | 'user');
        setAuthReady(true);
        return;
      } catch (e) {
        localStorage.removeItem('worktrack_user');
      }
    }

    // Fallback to Supabase Auth (if still using legacy auth)
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setCurrentUser(session.user);
          fetchUserRole(session.user.id);
        }
        setAuthReady(true);
      });

      let isRecovery = false;
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          isRecovery = true;
          setCurrentUser(session?.user ?? null);
          navigate('/reset-password');
          return;
        }
        if (isRecovery) return;
        if (session?.user) {
          setCurrentUser(session.user);
          fetchUserRole(session.user.id);
          if (event === 'SIGNED_IN') navigate('/dashboard');
        } else {
          setCurrentUser(null);
          setUserRole('user');
          navigate('/login');
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setAuthReady(true);
    }
  }, []);

  const fetchUserRole = async (userId: string) => {
    if (!isSupabaseConfigured) {
      setUserRole('admin');
      return;
    }
    try {
      // Try new app_users table first
      const { data, error } = await supabase
        .from('app_users').select('role').eq('id', userId).single();
      if (!error && data) {
        setUserRole(data.role as 'admin' | 'manager' | 'user');
        console.log('✅ User role fetched from app_users:', data.role);
      } else {
        // Fallback to legacy user_roles table
        const { data: legacyData, error: legacyError } = await supabase
          .from('user_roles').select('role').eq('user_id', userId).single();
        if (!legacyError && legacyData) {
          setUserRole(legacyData.role as 'admin' | 'manager' | 'user');
          console.log('✅ User role fetched from user_roles:', legacyData.role);
        } else {
          setUserRole('user');
        }
      }
    } catch (err) {
      console.error('❌ Error fetching user role:', err);
      setUserRole('user');
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    if (!isSupabaseConfigured) { setTasks(MOCK_TASKS); return; }

    const loadUserData = async () => {
      try {
        const { data: dbProjects, error: projErr } = await supabase.from('projects').select('*').order('name');
        if (!projErr && dbProjects && dbProjects.length === 0) {
          const seedProjects = ['Operations', 'Security', 'Product', 'Design'].map(name => ({
            name, description: `${name} queue for secure operations.`, user_id: currentUser.id
          }));
          await supabase.from('projects').insert(seedProjects);
          const { data: seededProjects } = await supabase.from('projects').select('*').order('name');
          if (seededProjects) setProjects(seededProjects);
        } else if (dbProjects) {
          setProjects(dbProjects);
        }

        const { data: dbTasks, error: taskErr } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (!taskErr && dbTasks) {
          if (dbTasks.length === 0) {
            const seedTasks = MOCK_TASKS.map(task => ({
              title: task.title, description: task.description, priority: task.priority,
              status: task.status, due_date: task.dueDate, assignees: task.assignees,
              category: task.category, user_id: currentUser.id
            }));
            await supabase.from('tasks').insert(seedTasks);
            const { data: seededTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
            if (seededTasks) setTasks(seededTasks.map(mapTask));
          } else {
            setTasks(dbTasks.map(mapTask));
          }
        }
      } catch (e) {
        console.error('Error synchronizing database:', e);
      }
    };
    loadUserData();
  }, [currentUser]);

  const mapTask = (t: any): Task => ({
    id: t.id, title: t.title, description: t.description || '',
    priority: t.priority, status: t.status, dueDate: t.due_date || '',
    assignees: t.assignees || [], category: t.category || 'Operations', project_id: t.project_id
  });

  const addTask = async (newTask: Omit<Task, 'id'>) => {
    const categoryName = newTask.category || 'Operations';
    if (isSupabaseConfigured && currentUser) {
      try {
        let targetProjectId = newTask.project_id;
        if (!targetProjectId) {
          const existingProj = projects.find((p: Project) => p.name.toLowerCase() === categoryName.toLowerCase());
          if (existingProj) {
            targetProjectId = existingProj.id;
          } else {
            const { data: newProj, error: err } = await supabase.from('projects')
              .insert({ name: categoryName, description: `Dynamic tasks and backlog.`, user_id: currentUser.id })
              .select().single();
            if (!err && newProj) { setProjects((prev: Project[]) => [...prev, newProj]); targetProjectId = newProj.id; }
          }
        }
        const { error } = await supabase.from('tasks').insert({
          title: newTask.title, description: newTask.description, priority: newTask.priority,
          status: newTask.status, due_date: newTask.dueDate, assignees: newTask.assignees,
          category: categoryName, project_id: targetProjectId, user_id: currentUser.id
        }).select().single();
        if (error) throw error;
        const { data: refreshed } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (refreshed) setTasks(refreshed.map(mapTask));
      } catch (err) {
        console.error('❌ Failed to write task to Supabase:', err);
        alert('Failed to save task: ' + (err as any).message);
      }
    } else {
      setTasks((prev: Task[]) => [{ ...newTask, id: Date.now().toString() }, ...prev]);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    setTasks((prev: Task[]) => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if (isSupabaseConfigured && currentUser) {
      await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    }
  };

  const updateTaskPriority = async (taskId: string, newPriority: Task['priority']) => {
    setTasks((prev: Task[]) => prev.map(t => t.id === taskId ? { ...t, priority: newPriority } : t));
    if (isSupabaseConfigured && currentUser) {
      await supabase.from('tasks').update({ priority: newPriority }).eq('id', taskId);
    }
  };

  const updateTaskAssignees = async (taskId: string, newAssignees: string[]) => {
    setTasks((prev: Task[]) => prev.map(t => t.id === taskId ? { ...t, assignees: newAssignees } : t));
    if (isSupabaseConfigured && currentUser) {
      await supabase.from('tasks').update({ assignees: newAssignees }).eq('id', taskId);
    }
  };

  const handleLogout = async () => {
    // Clear direct auth session
    localStorage.removeItem('worktrack_user');
    // Clear legacy Supabase auth session
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setCurrentUser(null);
    setUserRole('user');
    navigate('/login');
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser, authReady, userRole, setUserRole, tasks, projects, isModalOpen, setIsModalOpen,
      addTask, updateTaskStatus, updateTaskPriority, updateTaskAssignees, handleLogout
    }}>
      {children}
    </AppContext.Provider>
  );
}

function ProtectedLayout() {
  const { currentUser, setCurrentUser, authReady, userRole, setUserRole, tasks, projects, isModalOpen, setIsModalOpen, addTask, updateTaskStatus, updateTaskPriority, updateTaskAssignees, handleLogout } = useAppContext();
  const location = useLocation();

  if (!authReady) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-secondary border-t-transparent animate-spin" /></div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar currentPath={location.pathname} onLogout={handleLogout} userRole={userRole} />
      <main className="flex-1 ml-64 min-h-screen relative">
        <TopBar title={currentUser?.user_metadata?.full_name || currentUser?.email || 'Alex Thompson'} />
        <div className="pt-16 min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full"
            >
              <Routes>
                <Route path="/dashboard" element={<Dashboard tasks={tasks} onAddTask={() => setIsModalOpen(true)} onUpdateStatus={updateTaskStatus} />} />
                <Route path="/tasks" element={<Tasks tasks={tasks} onAddTask={() => setIsModalOpen(true)} onUpdateStatus={updateTaskStatus} onUpdatePriority={updateTaskPriority} onUpdateAssignees={updateTaskAssignees} />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addTask} projects={projects} />
    </div>
  );
}

function AppRoutes() {
  const { setCurrentUser, setUserRole } = useAppContext();

  const handleLogin = useCallback((user: any) => {
    // Update context state with logged in user
    setCurrentUser(user);
    const role = user?.user_metadata?.role || 'user';
    setUserRole(role as 'admin' | 'manager' | 'user');
  }, [setCurrentUser, setUserRole]);

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/reset-password" element={<ResetPassword onSuccess={() => {}} />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProviderWrapper />
    </BrowserRouter>
  );
}

function AppProviderWrapper() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

