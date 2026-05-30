import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  BarChart3, 
  ShieldCheck, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  currentPath: string;
  onLogout: () => void;
  userRole?: 'admin' | 'manager' | 'user';
}

export default function Sidebar({ currentPath, onLogout, userRole = 'user' }: SidebarProps) {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'user'] },
    { path: '/tasks', label: 'Tasks', icon: ClipboardList, roles: ['admin', 'manager', 'user'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager', 'user'] },
    { path: '/admin', label: 'Admin', icon: ShieldCheck, roles: ['admin'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container flex flex-col p-6 space-y-8 z-50 transition-colors duration-300">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl signature-gradient flex items-center justify-center text-white shadow-lg">
          <LayoutDashboard size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface font-headline leading-tight">WorkTrack Pro</h1>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">The Digital Curator</p>
        </div>
      </div>

      <nav className="flex-grow space-y-1">
        {visibleNavItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`relative w-full flex items-center space-x-3 px-4 py-3 font-medium text-sm rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-white/70 backdrop-blur-md text-secondary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/40'
              }`}
            >
              <item.icon size={20} className={isActive ? 'fill-secondary/10' : ''} />
              <span className="font-headline">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-secondary rounded-r-full"
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="pt-6 mt-6 border-t border-surface-container-high space-y-1">
        <button className="w-full flex items-center space-x-3 px-4 py-3 font-medium text-sm text-on-surface-variant hover:text-on-surface hover:bg-white/40 rounded-lg transition-all">
          <HelpCircle size={20} />
          <span className="font-headline">Support</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 font-medium text-sm text-on-surface-variant hover:text-on-surface hover:bg-white/40 rounded-lg transition-all"
        >
          <LogOut size={20} />
          <span className="font-headline">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
