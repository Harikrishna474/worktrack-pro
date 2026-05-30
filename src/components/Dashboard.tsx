import React from 'react';
import { PlayCircle, PauseCircle, TrendingUp, Filter, SortAsc, MoreHorizontal, CheckCircle2, Edit3, UserPlus, Sparkles, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Task } from '../types';

interface DashboardProps {
  tasks: Task[];
  onAddTask: () => void;
  onUpdateStatus?: (id: string, nextStatus: Task['status']) => void;
}

export default function Dashboard({ tasks, onAddTask, onUpdateStatus }: DashboardProps) {
  const getNextStatus = (current: Task['status']): Task['status'] => {
    switch (current) {
      case 'To Do': return 'In Progress';
      case 'In Progress': return 'Review';
      case 'Review': return 'Completed';
      case 'Completed': return 'To Do';
    }
  };

  return (
    <div className="p-12 space-y-12">
      {/* Hero Header */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="max-w-2xl">
          <h2 className="font-headline text-5xl font-extrabold text-on-surface tracking-tight mb-4">
            Good morning, curator.
          </h2>
          <p className="text-on-surface-variant text-lg leading-relaxed max-w-lg">
            Your digital workspace is calibrated. You have <span className="text-secondary font-semibold">
              {tasks.filter(t => t.priority === 'high').length} high-priority
            </span> tasks awaiting your attention today.
          </p>
        </div>
        <button 
          onClick={onAddTask}
          className="px-6 py-3 bg-gradient-to-br from-primary to-secondary text-white rounded-xl font-medium shadow-lg shadow-secondary/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Create New Entry
        </button>
      </section>

      {/* Focus Session & Stats */}
      <section className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-2xl p-10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8">
            <span className="text-[80px] font-black text-surface-container-low opacity-40 font-headline leading-none select-none">FOCUS</span>
          </div>
          
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-2 block">Active Focus Session</span>
            <h3 className="font-headline text-3xl font-bold text-on-surface">Interface Architecture Audit</h3>
            <div className="flex items-center gap-4 mt-4">
              <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold rounded-full uppercase tracking-wider">Internal Project</span>
              <span className="text-on-surface-variant text-sm flex items-center gap-1">
                <span className="w-4 h-4 opacity-70">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </span>
                02:45:12 elapsed
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-10">
            <div className="flex justify-between items-end mb-3">
              <p className="text-xs font-semibold text-on-surface">Progressive Completion</p>
              <p className="text-xs font-bold text-secondary">68%</p>
            </div>
            <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '68%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-secondary to-tertiary rounded-full shadow-[0_0_12px_rgba(0,91,196,0.3)]"
              />
            </div>
          </div>

          <div className="mt-10 flex gap-4 relative z-10">
            <button className="px-6 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
              <PauseCircle size={18} />
              Pause
            </button>
            <button className="px-6 py-2 text-error font-semibold text-sm hover:bg-error/5 rounded-lg transition-colors">
              Complete Session
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-surface-container-low rounded-2xl p-10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h4 className="font-headline text-xl font-bold text-on-surface">Output Ratio</h4>
              <TrendingUp className="text-secondary" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-on-surface-variant">Efficiency</p>
                <p className="text-sm font-bold">+12% vs last week</p>
              </div>
              
              <div className="flex items-end gap-2 h-28 pt-4">
                {[40, 60, 85, 100, 55, 70, 45].map((height, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-t-lg transition-all duration-500 ${i === 3 ? 'bg-secondary' : 'bg-surface-container-highest hover:bg-secondary/40'}`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-on-surface-variant/10 text-center">
            <button className="text-secondary text-sm font-bold hover:underline">Download Report</button>
          </div>
        </div>
      </section>

      {/* Ledger & Activity */}
      <section className="grid grid-cols-12 gap-12">
        <div className="col-span-12 xl:col-span-8">
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <h3 className="font-headline text-2xl font-bold text-on-surface">Current Ledger</h3>
              <p className="text-sm text-on-surface-variant">Strategic task management and delegation</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant">
                <Filter size={18} />
              </button>
              <button className="p-2 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant">
                <SortAsc size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {tasks.slice(0, 5).reverse().map((task) => (
              <div 
                key={task.id}
                className="bg-surface-container-lowest p-6 rounded-2xl ghost-border hover:shadow-xl hover:shadow-on-surface/5 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-surface-container flex items-center justify-center text-on-surface-variant font-bold">
                      {task.assignees[0] ? (
                        <div className="w-full h-full bg-secondary/10 flex items-center justify-center text-secondary text-lg">
                          {task.assignees[0].charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <UserPlus size={20} />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant mb-1 font-medium">{task.category}</p>
                      <h4 className="font-bold text-on-surface group-hover:text-secondary transition-colors font-headline">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-on-surface-variant">Due Date</p>
                      <p className="text-sm font-semibold">{task.dueDate || 'No Date'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        task.priority === 'high' ? 'bg-error/10 text-error' :
                        task.priority === 'medium' ? 'bg-secondary/10 text-secondary' : 
                        'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                        {task.priority.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        title="Click to cycle status"
                        onClick={() => onUpdateStatus?.(task.id, getNextStatus(task.status))}
                        className="px-4 py-1.5 text-[11px] font-bold rounded-full border transition-all hover:scale-105 active:scale-95 cursor-pointer text-left focus:outline-none"
                      >
                        {task.status === 'Completed' ? (
                          <span className="text-emerald-700 font-bold uppercase tracking-wider">
                            ✓ Done
                          </span>
                        ) : (
                          <span className={`inline-flex items-center text-xs font-semibold ${
                            task.status === 'In Progress' ? 'text-amber-700' :
                            task.status === 'Review' ? 'text-sky-700' : 'text-on-surface'
                          }`}>
                            {task.status}
                          </span>
                        )}
                      </button>
                    </div>

                    <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-12 text-on-surface-variant">
                <p className="text-sm">No tasks yet. Create your first task to get started!</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-8">
          <div className="bg-surface-container rounded-3xl p-8">
            <h4 className="font-headline text-xl font-bold text-on-surface mb-6">Recent Curator Pulse</h4>
            <div className="space-y-6">
              {[
                { icon: CheckCircle2, title: 'Project "Ethereal" finalized', desc: '2 hours ago • Marketing Dept' },
                { icon: Edit3, title: 'Protocol 4 updated', desc: '5 hours ago • System Admin' },
                { icon: UserPlus, title: 'Sarah joined the curated pool', desc: 'Yesterday • HR Team' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon size={16} className="text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface leading-tight">{item.title}</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 text-on-surface-variant text-xs font-bold uppercase tracking-widest hover:text-secondary transition-colors">
              View All Activity
            </button>
          </div>

          <div className="bg-gradient-to-br from-secondary to-tertiary rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <Sparkles size={32} className="mb-4" />
              <h5 className="text-lg font-bold mb-2 font-headline">Weekly Efficiency</h5>
              <p className="text-white/80 text-sm mb-6 leading-relaxed">
                You've curated 14% more data than the average lead this week. Exceptional focus.
              </p>
              <button className="px-5 py-2 bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold hover:bg-white/30 transition-all">
                Review Insights
              </button>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* FAB */}
      <button 
        onClick={onAddTask}
        className="fixed bottom-10 right-10 w-16 h-16 bg-gradient-to-r from-secondary to-tertiary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 hover:rotate-90"
      >
        <Plus size={32} />
      </button>
    </div>
  );
}
