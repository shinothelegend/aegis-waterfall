
type ViewType = 'dashboard' | 'events' | 'treasury' | 'audit';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  return (
    <nav className="hidden md:flex flex-col py-6 gap-2 bg-[#0A0A0A]/90 backdrop-blur-md border-r border-white/10 fixed left-0 top-28 h-[calc(100vh-112px)] w-64 z-40 text-primary">
      <div className="px-6 mb-8 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
          <span className="material-symbols-outlined text-2xl text-cyan-400">smart_toy</span>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">SYS OP</h2>
          <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">Controller Unit</p>
        </div>
      </div>

      <button 
        onClick={() => onChangeView('dashboard')}
        className={`flex items-center gap-4 px-6 py-3 text-left w-full transition-all duration-200 font-mono text-sm border-r-2 ${
          currentView === 'dashboard' ? 'text-cyan-400 border-cyan-400 bg-cyan-400/5' : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
        }`}
      >
        <span className="material-symbols-outlined">dashboard</span>
        Dashboard
      </button>

      <button 
        onClick={() => onChangeView('events')}
        className={`flex items-center gap-4 px-6 py-3 text-left w-full transition-all duration-200 font-mono text-sm border-r-2 ${
          currentView === 'events' ? 'text-cyan-400 border-cyan-400 bg-cyan-400/5' : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
        }`}
      >
        <span className="material-symbols-outlined">event_note</span>
        Event Escrows
      </button>

      <button 
        onClick={() => onChangeView('treasury')}
        className={`flex items-center gap-4 px-6 py-3 text-left w-full transition-all duration-200 font-mono text-sm border-r-2 ${
          currentView === 'treasury' ? 'text-cyan-400 border-cyan-400 bg-cyan-400/5' : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
        }`}
      >
        <span className="material-symbols-outlined">account_balance_wallet</span>
        Payout Settlements
      </button>

      <button 
        onClick={() => onChangeView('audit')}
        className={`flex items-center gap-4 px-6 py-3 text-left w-full transition-all duration-200 font-mono text-sm border-r-2 ${
          currentView === 'audit' ? 'text-cyan-400 border-cyan-400 bg-cyan-400/5' : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
        }`}
      >
        <span className="material-symbols-outlined">security</span>
        SBT Badges
      </button>
    </nav>
  );
}
