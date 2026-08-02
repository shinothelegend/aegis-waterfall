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
          <div key={ev.id} className="bg-zinc-950/85 border border-zinc-800 hover:border-zinc-500 transition-colors duration-300 rounded-xl p-5 flex flex-col justify-between font-brand">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-zinc-500">calendar_today</span>
                  Active Escrow
                </span>
                <span className="text-xs text-white font-bold font-brand">{ev.ticket_price} USDC</span>
              </div>
              <h3 className="text-sm text-white mb-2 font-bold font-brand uppercase tracking-wider">{ev.title}</h3>
              <p className="text-zinc-400 text-xs line-clamp-3 mb-6 leading-relaxed font-body">{ev.description}</p>
            </div>
            
            <div className="space-y-2.5 pt-4 border-t border-zinc-900 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-zinc-500">pin_drop</span>
                <span>{ev.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-zinc-500">schedule</span>
                <span>Ends {new Date(ev.end_time * 1000).toLocaleTimeString()}</span>
              </div>
              <button 
                onClick={() => onSelectEvent(ev.id)}
                className="w-full mt-4 bg-transparent border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 px-4 py-2 rounded font-bold text-xs transition-all flex justify-center items-center gap-2 uppercase tracking-wider"
              >
                Open Escrow Portal
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-20 bg-zinc-950 border border-zinc-800 rounded-xl font-brand">
          <span className="material-symbols-outlined text-5xl text-zinc-700 mb-4">event_busy</span>
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No escrows deployed yet</h3>
          <p className="text-zinc-500 text-xs mt-1 font-body">Deploy the first escrow event in the Dashboard panel.</p>
        </div>
      )}
    </div>
  );
}
