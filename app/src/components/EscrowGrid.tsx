import type { EventItem } from '../hooks/useCheckpointData';

interface EscrowGridProps {
  events: EventItem[];
  onSelectEvent: (eventId: string) => void;
}

export function EscrowGrid({ events, onSelectEvent }: EscrowGridProps) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((ev) => (
          <div key={ev.id} className="glass-panel rounded-xl p-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-transparent to-purple-600 opacity-10"></div>
            <div className="bg-[#0e0e12]/80 relative z-10 rounded-lg p-5 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-0.5 bg-[#050505] text-slate-300 border border-white/10 rounded font-mono text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-cyan-400">calendar_today</span>
                    Active Escrow
                  </span>
                  <span className="font-mono text-xs text-cyan-400 font-bold">{ev.ticket_price} USDC</span>
                </div>
                <h3 className="text-base text-white mb-2 font-bold font-mono">{ev.title}</h3>
                <p className="text-slate-400 text-xs line-clamp-3 mb-6 leading-relaxed">{ev.description}</p>
              </div>
              
              <div className="space-y-2.5 pt-4 border-t border-white/5 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-500">pin_drop</span>
                  <span>{ev.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-500">schedule</span>
                  <span>Ends {new Date(ev.end_time * 1000).toLocaleTimeString()}</span>
                </div>
                <button 
                  onClick={() => onSelectEvent(ev.id)}
                  className="w-full mt-4 bg-transparent border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 px-4 py-2 rounded font-bold text-xs transition-all flex justify-center items-center gap-2"
                >
                  Open Escrow Portal
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-20 bg-[#050505] border border-white/5 rounded-xl">
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">event_busy</span>
          <h3 className="text-base font-bold text-slate-400 font-mono">No escrows deployed yet</h3>
          <p className="text-slate-500 text-xs mt-1">Deploy the first escrow event in the Dashboard panel.</p>
        </div>
      )}
    </div>
  );
}
