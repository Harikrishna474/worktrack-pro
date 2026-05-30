import React, { useState } from 'react';
import { Plus, Filter, ChevronLeft, ChevronRight, CheckCircle2, MoreVertical, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { Task } from '../types';

interface TasksProps {
  tasks: Task[];
  onAddTask: () => void;
  onUpdateStatus?: (id: string, nextStatus: Task['status']) => void;
  onUpdatePriority?: (id: string, priority: Task['priority']) => void;
  onUpdateAssignees?: (id: string, assignees: string[]) => void;
}

export default function Tasks({ tasks, onAddTask, onUpdateStatus, onUpdatePriority, onUpdateAssignees }: TasksProps) {
  const [filter, setFilter] = useState<string>('All');
  const [editingAssignee, setEditingAssignee] = useState<string | null>(null);
  const [newAssigneeEmail, setNewAssigneeEmail] = useState('');

  const getNextStatus = (current: Task['status']): Task['status'] => {
    switch (current) {
      case 'To Do': return 'In Progress';
      case 'In Progress': return 'Review';
      case 'Review': return 'Completed';
      case 'Completed': return 'To Do';
    }
  };

  const handleAddAssignee = (taskId: string, currentAssignees: string[]) => {
    if (newAssigneeEmail && newAssigneeEmail.includes('@')) {
      onUpdateAssignees?.(taskId, [...currentAssignees, newAssigneeEmail]);
      setNewAssigneeEmail('');
      setEditingAssignee(null);
    }
  };

  const handleRemoveAssignee = (taskId: string, currentAssignees: string[], emailToRemove: string) => {
    onUpdateAssignees?.(taskId, currentAssignees.filter(e => e !== emailToRemove));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'All') return true;
    if (filter === 'Priority: High') return task.priority === 'high';
    return task.status === filter;
  });

  // Calculate workflow saturation dynamically
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const saturationPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="p-12 space-y-12">
       {/* Header */}
       <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">Operations Hub</span>
          <h2 className="text-5xl font-extrabold text-on-surface tracking-tight mb-4 font-headline">Current Tasks</h2>
          <p className="text-on-surface-variant leading-relaxed max-w-lg">Manage your digital curation workflow. Balance priorities across multiple pipelines and maintain institutional standards with ease.</p>
        </div>
        <button 
          onClick={onAddTask}
          className="signature-gradient text-white px-8 py-4 rounded-2xl flex items-center space-x-3 shadow-xl hover:shadow-2xl transition-all active:scale-95 group"
        >
          <Plus className="group-hover:rotate-90 transition-transform" />
          <span className="font-bold tracking-wide font-headline">Add New Task</span>
        </button>
      </section>

      {/* Filters & Capacity */}
      <div className="grid grid-cols-12 gap-8 items-center">
        <div className="col-span-12 lg:col-span-8 flex flex-wrap gap-3">
          <button 
            onClick={() => setFilter('All')}
            className={`px-5 py-2.5 shadow-sm rounded-full text-sm font-semibold flex items-center space-x-2 border transition-all ${
              filter === 'All' 
                ? 'bg-secondary text-white border-transparent' 
                : 'bg-white text-secondary border-secondary/10'
            }`}
          >
            <Filter size={14} />
            <span>All Statuses</span>
          </button>
          {['To Do', 'In Progress', 'Review', 'Completed', 'Priority: High'].map((label) => (
            <button 
              key={label} 
              onClick={() => setFilter(label)}
              className={`px-5 py-2.5 transition-all rounded-full text-sm font-semibold border ${
                filter === label
                  ? 'bg-secondary text-white border-transparent'
                  : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        
        <div className="col-span-12 lg:col-span-4 bg-surface-container-highest rounded-full h-10 relative overflow-hidden flex items-center px-4">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(5, saturationPercent)}%` }}
            className="absolute inset-y-0 left-0 signature-gradient rounded-r-full"
          />
          <div className="relative z-10 w-full flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter text-white mix-blend-difference">
            <span>Workflow Completion</span>
            <span>{saturationPercent}% Finished</span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-surface-container-low rounded-[2rem] p-2">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/30">
                  <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/60">Task Name</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/60">Priority</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/60">Status</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/60">Due Date</th>
                  <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/60 text-right">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {[...filteredTasks].map((task) => (
                  <tr key={task.id} className="group hover:bg-surface-container-low transition-colors duration-200">
                    <td className="px-8 py-6">
                      <div className="max-w-md">
                        <span className="text-[10px] font-bold text-secondary tracking-wider uppercase bg-secondary/5 px-2 py-0.5 rounded mr-2 inline-block mb-1">{task.category}</span>
                        <p className="font-headline font-bold text-on-surface text-lg leading-tight">{task.title}</p>
                        <p className="text-xs text-on-surface-variant mt-1">{task.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <select
                        value={task.priority}
                        onChange={(e) => onUpdatePriority?.(task.id, e.target.value as Task['priority'])}
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border-none cursor-pointer focus:ring-2 focus:ring-secondary/20 ${
                          task.priority === 'high' ? 'bg-error/10 text-error' :
                          task.priority === 'medium' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'
                        }`}
                      >
                        <option value="low">LOW</option>
                        <option value="medium">MEDIUM</option>
                        <option value="high">HIGH</option>
                      </select>
                    </td>
                    <td className="px-6 py-6">
                      <select
                        value={task.status}
                        onChange={(e) => onUpdateStatus?.(task.id, e.target.value as Task['status'])}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer focus:ring-2 focus:ring-secondary/20 ${
                          task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          task.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          task.status === 'Review' ? 'bg-sky-50 text-sky-700 border-sky-200' : 
                          'bg-surface-container-highest text-on-surface-variant border-surface-container-highest'
                        }`}
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm font-medium text-on-surface">{task.dueDate || 'No Date'}</p>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex justify-end items-center gap-2">
                        <div className="flex -space-x-2">
                          {task.assignees.length > 0 ? task.assignees.map((email, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-full ring-2 ring-white bg-secondary/10 flex items-center justify-center text-xs font-bold text-secondary relative group/assignee"
                              title={email}
                            >
                              {email.charAt(0).toUpperCase()}
                              <button
                                onClick={() => handleRemoveAssignee(task.id, task.assignees, email)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white rounded-full opacity-0 group-hover/assignee:opacity-100 transition-opacity flex items-center justify-center text-[10px]"
                              >
                                ×
                              </button>
                            </div>
                          )) : null}
                        </div>
                        {editingAssignee === task.id ? (
                          <div className="flex gap-1">
                            <input
                              type="email"
                              placeholder="email@example.com"
                              value={newAssigneeEmail}
                              onChange={(e) => setNewAssigneeEmail(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddAssignee(task.id, task.assignees)}
                              className="w-40 px-2 py-1 text-xs border border-secondary/20 rounded-lg focus:ring-2 focus:ring-secondary/20"
                              autoFocus
                            />
                            <button
                              onClick={() => handleAddAssignee(task.id, task.assignees)}
                              className="px-2 py-1 bg-secondary text-white text-xs rounded-lg hover:bg-secondary/90"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setEditingAssignee(null);
                                setNewAssigneeEmail('');
                              }}
                              className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-xs rounded-lg hover:bg-surface-container-highest"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingAssignee(task.id)}
                            className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center ring-2 ring-white hover:bg-secondary/10 hover:text-secondary transition-colors"
                            title="Add assignee"
                          >
                            <UserPlus size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-8 py-4 bg-surface-container-low/10 flex justify-between items-center border-t border-surface-container-low">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">Showing {filteredTasks.length} active tasks</p>
            <div className="flex space-x-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant">
                <ChevronLeft size={18} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary text-white font-bold text-xs">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
