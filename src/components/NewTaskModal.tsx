import React, { useState } from 'react';
import { X, Calendar, Flag, User, Type, AlignLeft, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Project } from '../types';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, 'id'>) => void;
  projects?: Project[];
}

export default function NewTaskModal({ isOpen, onClose, onAdd, projects }: NewTaskModalProps) {
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Operations',
    priority: 'medium' as const,
    dueDate: '',
    status: 'To Do' as const,
    assignees: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Form submitted with data:', formData);
    
    if (!formData.title) {
      console.warn('⚠️ Title is empty, aborting');
      return;
    }
    
    const taskToAdd = {
      ...formData,
      category: formData.category || 'General Operations',
    };
    
    console.log('✅ Calling onAdd with:', taskToAdd);
    onAdd(taskToAdd);
    
    setFormData({
      title: '',
      description: '',
      category: projects && projects.length > 0 ? projects[0].name : 'Operations',
      priority: 'medium',
      dueDate: '',
      status: 'To Do',
      assignees: []
    });
    setAssigneeEmail('');
    setIsCustomCategory(false);
    onClose();
  };

  const addAssignee = () => {
    if (assigneeEmail && assigneeEmail.includes('@')) {
      setFormData({
        ...formData,
        assignees: [...formData.assignees, assigneeEmail]
      });
      setAssigneeEmail('');
    }
  };

  const removeAssignee = (email: string) => {
    setFormData({
      ...formData,
      assignees: formData.assignees.filter(a => a !== email)
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-[2rem] shadow-2xl z-[101] overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight">New Curation Entry</h3>
                  <p className="text-on-surface-variant text-sm mt-1">Define the parameters for your next strategic task.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-surface-container rounded-full transition-colors"
                >
                  <X className="text-on-surface-variant" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                    <Type size={12} />
                    Entry Title
                  </label>
                  <input
                    autoFocus
                    type="text"
                    required
                    placeholder="e.g., Audit Protocol Delta"
                    className="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary/20 transition-all font-semibold"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                    <FolderOpen size={12} />
                    Project / Category tracking
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <select
                      className="flex-1 bg-surface-container-low border-none rounded-xl px-5 py-4 text-on-surface font-semibold focus:ring-2 focus:ring-secondary/20 transition-all cursor-pointer"
                      value={isCustomCategory ? 'custom' : formData.category}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setIsCustomCategory(true);
                          setFormData({ ...formData, category: '' });
                        } else {
                          setIsCustomCategory(false);
                          setFormData({ ...formData, category: val });
                        }
                      }}
                    >
                      {projects && projects.length > 0 ? (
                        projects.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))
                      ) : (
                        <>
                          <option value="Operations">Operations</option>
                          <option value="Security">Security</option>
                          <option value="Product">Product</option>
                          <option value="Design">Design</option>
                        </>
                      )}
                      <option value="custom">+ Create Custom Category/Project...</option>
                    </select>
                    
                    {isCustomCategory && (
                      <input
                        type="text"
                        required
                        placeholder="e.g., Protocol delta"
                        className="flex-1 bg-surface-container-low border-none rounded-xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary/20 transition-all font-semibold"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                    <AlignLeft size={12} />
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide context for the task curator..."
                    className="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary/20 transition-all text-sm resize-none"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                      <Flag size={12} />
                      Priority Level
                    </label>
                    <select
                      className="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 text-on-surface font-semibold focus:ring-2 focus:ring-secondary/20 transition-all appearance-none"
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                    >
                      <option value="low">Low Impact</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Urgency</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                      <Calendar size={12} />
                      Due Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 text-on-surface font-semibold focus:ring-2 focus:ring-secondary/20 transition-all"
                      value={formData.dueDate}
                      onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                    <User size={12} />
                    Assignees
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      className="flex-1 bg-surface-container-low border-none rounded-xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary/20 transition-all"
                      value={assigneeEmail}
                      onChange={e => setAssigneeEmail(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addAssignee())}
                    />
                    <button
                      type="button"
                      onClick={addAssignee}
                      className="px-6 py-4 bg-secondary/10 text-secondary font-bold rounded-xl hover:bg-secondary/20 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {formData.assignees.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.assignees.map((email, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-surface-container-high px-3 py-2 rounded-lg text-sm"
                        >
                          <span className="text-on-surface font-medium">{email}</span>
                          <button
                            type="button"
                            onClick={() => removeAssignee(email)}
                            className="text-on-surface-variant hover:text-error transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 px-6 bg-surface-container-high text-on-surface font-bold rounded-2xl hover:bg-surface-container-highest transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-4 px-6 signature-gradient text-white font-bold rounded-2xl shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Add to Ledger
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
