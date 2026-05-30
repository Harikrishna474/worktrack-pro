import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, Zap, Clock, Activity, Download, FileText, Users as UsersIcon, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

interface ReportStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalUsers: number;
  activeUsers: number;
  completionRate: number;
}

export default function Reports() {
  const [stats, setStats] = useState<ReportStats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    totalUsers: 0,
    activeUsers: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  async function fetchReportData() {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setTasks(tasksData || []);
      setUsers(usersData || []);

      // Calculate statistics
      const totalTasks = tasksData?.length || 0;
      const completedTasks = tasksData?.filter(t => t.status === 'Completed').length || 0;
      const inProgressTasks = tasksData?.filter(t => t.status === 'In Progress').length || 0;
      const totalUsers = usersData?.length || 0;
      const activeUsers = usersData?.filter(u => u.status === 'active').length || 0;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setStats({
        totalTasks,
        completedTasks,
        inProgressTasks,
        totalUsers,
        activeUsers,
        completionRate
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV(data: any[], filename: string, headers: string[]) {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header.toLowerCase().replace(/ /g, '_')] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportUserReport() {
    const userData = users.map(user => ({
      id: user.id,
      full_name: user.full_name || 'N/A',
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: new Date(user.created_at).toLocaleDateString(),
      last_login: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'
    }));

    downloadCSV(userData, 'user_report', ['ID', 'Full_Name', 'Email', 'Role', 'Status', 'Created_At', 'Last_Login']);
  }

  function exportTaskReport() {
    const taskData = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || 'N/A',
      status: task.status,
      priority: task.priority,
      category: task.category || 'N/A',
      due_date: task.dueDate || 'N/A',
      created_at: new Date(task.created_at).toLocaleDateString()
    }));

    downloadCSV(taskData, 'task_report', ['ID', 'Title', 'Description', 'Status', 'Priority', 'Category', 'Due_Date', 'Created_At']);
  }

  function exportWorkReport() {
    const workData = tasks.map(task => {
      const assigneeCount = Array.isArray(task.assignees) ? task.assignees.length : 0;
      return {
        task_title: task.title,
        status: task.status,
        priority: task.priority,
        assignee_count: assigneeCount,
        category: task.category || 'N/A',
        due_date: task.dueDate || 'N/A'
      };
    });

    downloadCSV(workData, 'work_report', ['Task_Title', 'Status', 'Priority', 'Assignee_Count', 'Category', 'Due_Date']);
  }

  function exportFullReport() {
    const fullData = [{
      report_date: new Date().toLocaleDateString(),
      total_users: stats.totalUsers,
      active_users: stats.activeUsers,
      total_tasks: stats.totalTasks,
      completed_tasks: stats.completedTasks,
      in_progress_tasks: stats.inProgressTasks,
      completion_rate: `${stats.completionRate}%`
    }];

    downloadCSV(fullData, 'full_report', ['Report_Date', 'Total_Users', 'Active_Users', 'Total_Tasks', 'Completed_Tasks', 'In_Progress_Tasks', 'Completion_Rate']);
  }

  return (
    <div className="p-12 space-y-12">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-extrabold font-headline text-on-surface tracking-tight mb-2">Performance Gallery</h2>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">A curated overview of your organization's operational velocity. We track every pulse of productivity to ensure the rhythm of work remains fluid.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportUserReport}
            disabled={!isSupabaseConfigured || users.length === 0}
            className="px-4 py-2.5 bg-white border border-surface-container-high text-on-surface text-sm font-medium rounded-xl hover:bg-surface-container-low transition-all font-headline flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UsersIcon size={16} />
            User Report
          </button>
          <button
            onClick={exportTaskReport}
            disabled={!isSupabaseConfigured || tasks.length === 0}
            className="px-4 py-2.5 bg-white border border-surface-container-high text-on-surface text-sm font-medium rounded-xl hover:bg-surface-container-low transition-all font-headline flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={16} />
            Task Report
          </button>
          <button
            onClick={exportWorkReport}
            disabled={!isSupabaseConfigured || tasks.length === 0}
            className="px-4 py-2.5 bg-white border border-surface-container-high text-on-surface text-sm font-medium rounded-xl hover:bg-surface-container-low transition-all font-headline flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Briefcase size={16} />
            Work Report
          </button>
          <button
            onClick={exportFullReport}
            disabled={!isSupabaseConfigured}
            className="px-4 py-2.5 signature-gradient text-white text-sm font-medium rounded-xl shadow-lg shadow-secondary/10 hover:scale-[1.02] active:scale-[0.98] transition-all font-headline flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Full Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-on-surface-variant">Loading statistics...</div>
        ) : !isSupabaseConfigured ? (
          <>
            {[
              { label: 'Total Tasks', val: 'N/A', trend: 'Configure Supabase', icon: CheckCircle, color: 'text-secondary' },
              { label: 'Active Users', val: 'N/A', trend: 'Configure Supabase', icon: Clock, color: 'text-secondary' },
              { label: 'Completion Rate', val: 'N/A', trend: 'Configure Supabase', icon: Zap, color: 'text-tertiary' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-10 rounded-2xl relative overflow-hidden group shadow-sm">
                <div className="relative z-10">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className="text-4xl font-headline font-extrabold text-on-surface">{stat.val}</h3>
                  <div className={`mt-4 flex items-center ${stat.color} font-semibold text-sm`}>
                    <TrendingUp size={14} className="mr-1" />
                    <span>{stat.trend}</span>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                  <stat.icon size={120} />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {[
              { 
                label: 'Total Tasks', 
                val: stats.totalTasks.toString(), 
                trend: `${stats.completedTasks} completed`, 
                icon: CheckCircle, 
                color: 'text-secondary' 
              },
              { 
                label: 'Active Users', 
                val: `${stats.activeUsers}/${stats.totalUsers}`, 
                trend: `${Math.round((stats.activeUsers / stats.totalUsers) * 100) || 0}% active`, 
                icon: Clock, 
                color: 'text-secondary' 
              },
              { 
                label: 'Completion Rate', 
                val: `${stats.completionRate}%`, 
                trend: stats.completionRate >= 70 ? 'Excellent performance' : 'Room for improvement', 
                icon: Zap, 
                color: 'text-tertiary' 
              },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-10 rounded-2xl relative overflow-hidden group shadow-sm">
                <div className="relative z-10">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className="text-4xl font-headline font-extrabold text-on-surface">{stat.val}</h3>
                  <div className={`mt-4 flex items-center ${stat.color} font-semibold text-sm`}>
                    <TrendingUp size={14} className="mr-1" />
                    <span>{stat.trend}</span>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                  <stat.icon size={120} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="bg-surface-container-low rounded-3xl p-10 border border-surface-container-high/50">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h4 className="text-xl font-headline font-bold text-on-surface">Productivity Trends</h4>
            <p className="text-sm text-on-surface-variant">Output velocity across the previous 30 days</p>
          </div>
          <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-full shadow-sm">
            <button className="px-4 py-1.5 bg-white text-xs font-bold rounded-full shadow-sm">Monthly</button>
            <button className="px-4 py-1.5 text-xs font-bold text-on-surface-variant">Quarterly</button>
          </div>
        </div>

        <div className="h-80 relative flex items-end">
          <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[50, 150, 250].map(y => (
              <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="currentColor" strokeDasharray="4 4" strokeWidth="0.5" className="text-on-surface-variant/20" />
            ))}
            <path 
              d="M0,250 Q100,200 200,220 T400,100 T600,150 T800,50 T1000,80 V300 H0 Z" 
              fill="url(#chartGradient)" 
            />
            <motion.path 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              d="M0,250 Q100,200 200,220 T400,100 T600,150 T800,50 T1000,80" 
              fill="none" 
              stroke="var(--color-secondary)" 
              strokeWidth="4" 
              strokeLinecap="round" 
            />
          </svg>
          <div className="absolute bottom-0 left-0 w-full flex justify-between px-2 pt-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
            <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-highest rounded-2xl overflow-hidden shadow-lg shadow-on-surface/5">
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white rounded-xl shadow-sm">
              <Activity className="text-secondary" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-on-surface uppercase tracking-widest font-headline">Task Completion Progress</h5>
              <p className="text-xs text-on-surface-variant">Current Cycle Performance</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-headline font-extrabold text-on-surface">{stats.completionRate}%</span>
            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">
              {stats.completionRate >= 70 ? 'On Track' : 'Needs Attention'}
            </p>
          </div>
        </div>
        <div className="w-full h-4 bg-surface-container relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${stats.completionRate}%` }}
            className="absolute top-0 left-0 h-full signature-gradient" 
          />
        </div>
      </div>

      {/* Recent Tasks Table */}
      {isSupabaseConfigured && tasks.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-surface-container">
          <div className="p-6 border-b border-surface-container">
            <h3 className="text-xl font-headline font-bold text-on-surface">Recent Tasks Overview</h3>
            <p className="text-sm text-on-surface-variant mt-1">Latest task activities and status</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Task</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {tasks.slice(0, 10).map((task) => (
                  <tr key={task.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-sm text-on-surface">{task.title}</p>
                      <p className="text-xs text-on-surface-variant truncate max-w-xs">{task.description || 'No description'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                        task.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        task.status === 'Review' ? 'bg-amber-100 text-amber-800' :
                        'bg-surface-container text-on-surface-variant'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                        task.priority === 'high' ? 'bg-rose-100 text-rose-800' :
                        task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-surface-container text-on-surface-variant'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{task.category || 'Uncategorized'}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{task.dueDate || 'No due date'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
