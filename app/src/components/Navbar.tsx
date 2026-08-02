import { ConnectButton } from '@rainbow-me/rainbowkit';
import toast from 'react-hot-toast';

interface NavbarProps {
  onSync: () => void;
  onNavigateToLanding?: () => void;
  onOpenSettings: () => void;
}

export function Navbar({ onSync, onNavigateToLanding, onOpenSettings }: NavbarProps) {
  const handleSyncClick = () => {
    onSync();
    toast.success("Synced database!");
  };

  return (
    <header className="bg-black/90 backdrop-blur-xl border-b border-zinc-800 fixed top-0 w-full z-50 flex justify-between items-center h-16 px-6 md:px-12 text-white">
      <div 
        className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={onNavigateToLanding}
      >
        <div className="w-5 h-5 relative rounded-full overflow-hidden border border-zinc-800 flex items-center justify-center bg-white shrink-0">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="100" fill="#ffffff" />
            <path d="M 100 0 A 100 100 0 0 1 100 200 A 50 50 0 0 1 100 100 A 50 50 0 0 0 100 0" fill="#000000" />
            <circle cx="100" cy="50" r="15" fill="#ffffff" />
            <circle cx="100" cy="150" r="15" fill="#000000" />
          </svg>
        </div>
        <span className="font-brand font-bold tracking-widest uppercase text-base text-white">
          AEGIS WATERFALL
        </span>
        <div className="hidden md:flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
          <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-brand">System Active</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {onNavigateToLanding && (
          <button 
            onClick={onNavigateToLanding}
            className="text-xs font-brand px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">home</span>
            Landing Page
          </button>
        )}
        
        {/* Configure settings button */}
        <button 
          onClick={onOpenSettings}
          className="text-zinc-400 hover:text-white transition-colors duration-300 active:scale-95 flex items-center justify-center p-1"
          title="Configure Contracts"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>

        <button 
          onClick={handleSyncClick}
          className="text-zinc-400 hover:text-white transition-colors duration-300 active:scale-95 flex items-center justify-center p-1"
          title="Sync Database"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>sensors</span>
        </button>
        
        <ConnectButton />
      </div>
    </header>
  );
}
