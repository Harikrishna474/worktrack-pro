import React from 'react';
import { Search, Bell, Grid } from 'lucide-react';

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title }: TopBarProps) {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-8 z-40 transition-colors">
      <div className="flex items-center flex-1">
        <div className="relative w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 w-4 h-4" />
          <input
            type="text"
            className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-secondary/20 transition-all placeholder:text-on-surface-variant/40"
            placeholder="Search tasks, reports, or members..."
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="hover:bg-surface-container rounded-full p-2 transition-all text-on-surface-variant relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-surface"></span>
        </button>
        <button className="hover:bg-surface-container rounded-full p-2 transition-all text-on-surface-variant">
          <Grid size={20} />
        </button>
        
        <div className="h-8 w-px bg-surface-container-high mx-2"></div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-on-surface leading-tight">Alex Thompson</p>
            <p className="text-[10px] text-on-surface-variant font-medium">Lead Curator</p>
          </div>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuABZGFz6h0SXNDF4Ww9nriO_fy1EONYAJr2qdaFKMOThBgvNTakNCHKls3jQS6XSTMmoeBjmZbE_08e2akG9FgWSTWdDsQblOgnPs_v4CEHxZhuqgBw6te74w2sZ0fE_Ti9kCL-asmr0iKTAc1P7XH_CS4jWfufUlKrMVH4mDUnQN2tqdj4ZUb0xJgdD1RBtyyyX-b14Q_CKfvqHMUrEsF2nqjDE8SXfIl_q9r8qYUNsIagSeSz5ZaSls8k7YVzBwS5_6qk_A56jsXL"
            alt="User"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
        </div>
      </div>
    </header>
  );
}
