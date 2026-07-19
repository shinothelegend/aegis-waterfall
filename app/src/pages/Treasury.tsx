import type { EventItem } from '../hooks/useCheckpointData';

interface TreasuryProps {
  events: EventItem[];
  rsvps: any[];
}

export function Treasury({ events, rsvps }: TreasuryProps) {
  const expiredEvents = events.filter(ev => Math.floor(Date.now() / 1000) > ev.end_time);

  return (
    <div className="space-y-6">
      <div className="glass-panel border border-white/10 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4 font-mono">Ended Events Awaiting Payout Settlements</h3>
        <p className="text-xs text-slate-400 mb-6 font-mono">Below is the queue of events whose end times have passed. The AI agent will autonomously trigger payouts to vendors and organizers.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold font-mono">
                <th className="py-3">Event Title</th>
                <th className="py-3">Organizer</th>
                <th className="py-3 text-center">EndTime</th>
                <th className="py-3 text-center">Treasury Balance</th>
                <th className="py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {expiredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-mono">No expired event escrows detected.</td>
                </tr>
              ) : (
                expiredEvents.map((ev) => {
                  const hasBalance = rsvps.filter(r => r.event_id === ev.id && r.status === 'deposited').length > 0;
                  return (
                    <tr key={ev.id} className="border-b border-white/5 hover:bg-white/5 font-mono">
                      <td className="py-3 font-semibold text-white">{ev.title}</td>
                      <td className="py-3">{ev.organizer.substring(0, 12)}...</td>
                      <td className="py-3 text-center">{new Date(ev.end_time * 1000).toLocaleString()}</td>
                      <td className="py-3 text-center text-cyan-400 font-semibold">{ev.ticket_price} USDC</td>
                      <td className="py-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          !hasBalance ? 'bg-white/5 text-slate-400 border border-white/10' :
                          'bg-pink-950/20 text-pink-400 border border-pink-800/30'
                        }`}>
                          {hasBalance ? "Pending Settle" : "Settled"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
