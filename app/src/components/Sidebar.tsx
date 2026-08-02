type ViewType = 'dashboard' | 'events' | 'treasury' | 'audit';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  return (
    <nav className="hidden md:flex flex-col py-6 gap-2 bg-black/95 backdrop-blur-md border-r border-zinc-800 fixed left-0 top-16 h-[calc(100vh-64px)] w-64 z-40 text-white">
      <div className="px-6 mb-8 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
          <span className="material-symbols-outlined text-2xl text-white">smart_toy</span>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">SYS OP</h2>
          <p className="font-brand text-[10px] text-zinc-500 uppercase tracking-wider">Controller Unit</p>
        </div>
      </div>

      <button 
        onClick={() => onChangeView('dashboard')}
        className={`flex items-center gap-4 px-6 py-3 text-left w-full transition-all duration-200 font-brand text-sm border-r-2 ${
          currentView === 'dashboard' ? 'text-white border-white bg-zinc-900' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border-transparent'
        }`}
      >
        <span className="material-symbols-outlined">dashboard</span>
        Dashboard
      </button>

      <button 
        onClick={() => onChangeView('events')}
        className={`flex items-center gap-4 px-6 py-3 text-left w-full transition-all duration-200 font-brand text-sm border-r-2 ${
          currentView === 'events' ? 'text-white border-white bg-zinc-900' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border-transparent'
        }`}
      >
        <span className="material-symbols-outlined">event_note</span>
        Event Escrows
      </button>

      <button 
        onClick={() => onChangeView('treasury')}
        className={`flex items-center gap-4 px-6 py-3 text-left w-full transition-all duration-200 font-brand text-sm border-r-2 ${
          currentView === 'treasury' ? 'text-white border-white bg-zinc-900' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border-transparent'
        }`}
      >
        <span className="material-symbols-outlined">account_balance_wallet</span>
        Payout Settlements
      </button>

      <button 
        onClick={() => onChangeView('audit')}
        className={`flex items-center gap-4 px-6 py-3 text-left w-full transition-all duration-200 font-brand text-sm border-r-2 ${
          currentView === 'audit' ? 'text-white border-white bg-zinc-900' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border-transparent'
        }`}
      >
        <span className="material-symbols-outlined">security</span>
        SBT Badges
      </button>
    </nav>
  );
}
