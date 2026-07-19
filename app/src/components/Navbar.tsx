import { ConnectButton } from '@rainbow-me/rainbowkit';
import toast from 'react-hot-toast';

interface NavbarProps {
  onSync: () => void;
}

export function Navbar({ onSync }: NavbarProps) {
  const handleSyncClick = () => {
    onSync();
    toast.success("Synced database!");
  };

  return (
    <header className="bg-[#0e0e12]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_20px_rgba(0,240,255,0.1)] fixed top-0 w-full z-50 flex justify-between items-center h-16 px-6 md:px-12 text-primary">
      <div className="flex items-center gap-4">
        <span className="font-display-lg text-[22px] font-black tracking-tighter text-glow-cyan bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          AEGIS WATERFALL
        </span>
        <div className="hidden md:flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-white/5 border border-white/5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Daemon Active</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button 
          onClick={handleSyncClick}
          className="text-slate-400 hover:text-cyan-400 transition-colors duration-300 active:scale-95 flex items-center justify-center"
          title="Sync Database"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>sensors</span>
        </button>
        <ConnectButton />
      </div>
    </header>
  );
}
