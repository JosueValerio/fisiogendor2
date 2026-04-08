import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="sticky top-0 right-0 w-full z-40 flex justify-between items-center px-8 h-20 bg-surface/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center bg-surface-low px-4 py-2.5 rounded-full w-96 border border-white/5 focus-within:border-primary/30 transition-all">
        <Search size={18} className="text-on-surface-variant mr-3" />
        <input 
          type="text" 
          placeholder="Buscar pacientes, exames ou prontuários..."
          className="bg-transparent border-none focus:ring-0 text-sm w-full text-white placeholder-on-surface-variant"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-white transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-surface"></span>
          </button>
          <button className="text-on-surface-variant hover:text-white transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>

        <div className="h-8 w-[1px] bg-white/10"></div>

        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="text-right">
            <p className="text-white font-bold text-sm">Dr. Ricardo Silva</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Perfil Profissional</p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary/50 transition-all">
            <img 
              src="https://picsum.photos/seed/physio/100/100" 
              alt="Dr. Ricardo Silva" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
