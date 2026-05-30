import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Edit2, Trash2, X, Plus } from 'lucide-react';
import { MOCK_LOGS } from '../constants';
import { motion } from 'motion/react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import type { User, UserRole } from '../types';
import bcrypt from 'bcryptjs';

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as UserRole,
    status: 'active' as 'active' | 'away' | 'offline',
    avatar: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }

  async function handleDelete(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    
    console.log('[Admin] Deleting user:', userId);
    
    try {
      // Try RPC function first
      const { error: rpcError } = await supabase.rpc('delete_user_by_id', { p_user_id: userId });
      
      if (rpcError) {
        console.warn('[Admin] RPC delete failed, trying direct delete:', rpcError);
        
        // Fallback: direct delete from app_users
        const { error: deleteError } = await supabase
          .from('app_users')
          .delete()
          .eq('id', userId);
        
        if (deleteError) {
          console.error('[Admin] Direct delete also failed:', deleteError);
          alert('Failed to delete user: ' + deleteError.message);
          return;
        }
      }
      
      console.log('[Admin] User deleted successfully');
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error('[Admin] Unexpected error during delete:', err);
      alert('An unexpected error occurred while deleting the user');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingUser) {
      // Update existing user
      const updateData: any = {
        full_name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        avatar: formData.avatar
      };

      // Only update password if provided
      if (formData.password) {
        updateData.password_hash = await bcrypt.hash(formData.password, 10);
      }

      const { error } = await supabase.from('app_users').update(updateData).eq('id', editingUser.id);
      if (error) {
        console.error('Error updating user:', error);
        alert('Failed to update user: ' + error.message);
      } else {
        setUsers(users.map(u => u.id === editingUser.id ? { 
          ...u, 
          full_name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          avatar: formData.avatar
        } : u));
        closeModal();
      }
    } else {
      // Create new user - Direct DB approach
      console.log('[Admin] Creating new user:', formData.email);

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('app_users')
        .select('email')
        .eq('email', formData.email)
        .single();

      if (existingUser) {
        alert('A user with this email already exists.');
        return;
      }

      // Hash password with bcrypt (10 rounds)
      const passwordHash = await bcrypt.hash(formData.password, 10);

      // Insert directly into app_users table
      const { data: newUser, error: insertError } = await supabase
        .from('app_users')
        .insert({
          email: formData.email,
          password_hash: passwordHash,
          full_name: formData.name,
          role: formData.role,
          status: formData.status,
          avatar: formData.avatar
        })
        .select('id, email, full_name, role, status, avatar, created_at')
        .single();

      if (insertError) {
        console.error('[Admin] Insert error:', insertError);
        alert('Failed to create user: ' + insertError.message);
      } else {
        console.log('[Admin] User created:', newUser);
        setUsers([newUser, ...users]);
        closeModal();
      }
    }
  }

  function openModal(user?: User) {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.full_name || user.name,
        email: user.email,
        password: '', // Don't populate password for editing
        role: user.role,
        status: user.status,
        avatar: user.avatar
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'user', status: 'active', avatar: '' });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'user', status: 'active', avatar: '' });
  }

  return (
    <div className="p-12 space-y-12">
      <header className="flex justify-between items-end mb-12">
        <div className="space-y-2">
          <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">Admin Control</h2>
          <p className="text-on-surface-variant font-body max-w-lg">Manage organizational hierarchy, system infrastructure, and security protocols from a single curated source.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-6 py-2.5 bg-surface-container-high text-on-surface text-sm font-medium rounded-xl hover:bg-surface-container-highest transition-all font-headline">Export</button>
          <button onClick={() => openModal()} className="px-6 py-2.5 signature-gradient text-white text-sm font-medium rounded-xl shadow-lg shadow-secondary/10 hover:scale-[1.02] active:scale-[0.98] transition-all font-headline flex items-center gap-2">
            <Plus size={16} /> New User
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* User Management */}
        <section className="col-span-12 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="text-secondary" size={20} />
              <h3 className="text-xl font-headline font-bold text-on-surface">User Management</h3>
            </div>
            <button className="text-secondary text-sm font-semibold hover:underline">View All Directory</button>
          </div>
          
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-surface-container">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">Loading users...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">No users found. Add your first user above.</td></tr>
                ) : (users.map((user) => (
                  <tr key={user.id} className="group hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        {user.avatar ? (
                          <img src={user.avatar} className="w-10 h-10 rounded-lg object-cover" alt={user.full_name || user.name} />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary font-bold text-xs">
                             {(user.full_name || user.name).split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm">{user.full_name || user.name}</p>
                          <p className="text-xs text-on-surface-variant">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-medium px-2 py-1 bg-surface-container text-on-surface-variant rounded-md">{user.role}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-1.5">
                        <div className={`w-2 h-2 rounded-full ${
                          user.status === 'active' ? 'bg-emerald-500' :
                          user.status === 'away' ? 'bg-amber-400' : 'bg-on-surface-variant'
                        }`} />
                        <span className="text-sm font-medium">{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">{user.last_active || user.lastActive}</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(user)} className="text-on-surface-variant hover:text-secondary p-1.5 rounded-md hover:bg-surface-container transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="text-on-surface-variant hover:text-error p-1.5 rounded-md hover:bg-error/10 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Workspace Settings */}
     

        {/* Security Section */}
        <section className="col-span-12 space-y-8 pt-8">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-secondary" size={20} />
            <h3 className="text-xl font-headline font-bold text-on-surface">Security & Governance</h3>
          </div>
          
          <div className="bg-white rounded-2xl p-8 space-y-6 shadow-sm border border-surface-container">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-on-surface font-headline">Recent Access Logs</h4>
              <button className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Clear History</button>
            </div>
            
            <div className="space-y-6">
              {MOCK_LOGS.map((log) => (
                <div key={log.id} className="flex items-start space-x-4">
                  <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                    log.type === 'success' ? 'bg-emerald-500' :
                    log.type === 'error' ? 'bg-error' : 'bg-secondary'
                  }`} />
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-bold">{log.title}</p>
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">{log.time}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{log.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-headline font-bold">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-surface-container rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-surface-container rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 bg-surface-container rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary" required disabled={!!editingUser} />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Password {editingUser && <span className="text-[10px] font-normal">(leave blank to keep current)</span>}
                </label>
                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 bg-surface-container rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary" required={!editingUser} placeholder={editingUser ? "Enter new password to change" : "••••••••"} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Role</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })} className="w-full px-4 py-2 bg-surface-container rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary">
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'away' | 'offline' })} className="w-full px-4 py-2 bg-surface-container rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary">
                    <option value="active">Active</option>
                    <option value="away">Away</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Avatar URL (optional)</label>
                <input type="url" value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })} className="w-full px-4 py-2 bg-surface-container rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary" placeholder="https://..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-surface-container text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 signature-gradient text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">{editingUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="col-span-12">
        <div className="bg-surface-container-highest rounded-full h-10 w-full overflow-hidden relative flex items-center px-8">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '99.98%' }}
            className="absolute inset-y-0 left-0 signature-gradient rounded-r-full shadow-lg shadow-secondary/20" 
          />
          <div className="relative z-10 w-full flex justify-between items-center">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Monthly Server Uptime: 99.98%</span>
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Next Maintenance: Oct 24</span>
          </div>
        </div>
      </section>
    </div>
  );
}
