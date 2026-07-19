import { LiveLogs } from '../components/LiveLogs';
import { CreateEventForm } from '../components/CreateEventForm';
import { Scanner } from '../components/Scanner';
import type { EventItem, AgentDecision, InvoiceItem } from '../hooks/useCheckpointData';

interface DashboardProps {
  events: EventItem[];
  decisions: AgentDecision[];
  invoices: InvoiceItem[];
  rsvps: any[];
  selectedEventId: string | null;
  manualAttendeeAddress: string;
  onSelectEvent: (eventId: string | null) => void;
  onCheckIn: (attendeeAddr: string) => void;
  onCreateEvent: (title: string, desc: string, price: string, date: string, location: string, duration: string) => void;
}

export function Dashboard({
  events,
  decisions,
  invoices,
  rsvps,
  selectedEventId,
  onSelectEvent,
  onCheckIn,
  onCreateEvent
}: DashboardProps) {
  // Calculate Total Escrow locked
  const totalBalanceSum = events.reduce((sum, ev) => sum + (ev.ticket_price), 0);
  const totalRSVPDeposits = rsvps.filter(r => r.status === 'deposited').length;
  // If each ticket price is 50 or variable
  const utilizationPercent = totalBalanceSum > 0 
    ? Math.min(Math.round((totalRSVPDeposits * 50 / totalBalanceSum) * 100), 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Treasury Card */}
        <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-600"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
              <span className="material-symbols-outlined text-cyan-400">account_balance</span>
              Treasury Overview
            </h3>
          </div>
          <div className="mt-4 mb-2">
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">On-chain Escrow Balance</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-extrabold text-white text-glow-cyan">
                {events.length > 0 ? (events.length * 50).toFixed(2) : "0.00"}
              </span>
              <span className="text-sm text-slate-500 mb-1 font-mono">USDC</span>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between font-mono text-xs text-slate-400 mb-2">
              <span>RSVP Escrow Utilization</span>
              <span>{utilizationPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500" 
                style={{ width: `${utilizationPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Audit Queue */}
        <div className="glass-panel rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
              <span className="material-symbols-outlined text-purple-400">receipt_long</span>
              Audit Queue
            </h3>
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          </div>
          <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1 terminal-scroll">
            {invoices.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center font-mono">No vendor invoices in audit.</p>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="bg-white/5 border border-white/5 rounded-lg p-4 hover:border-cyan-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded border border-white/10 text-slate-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                      </div>
                      <div>
                        <p className="font-mono text-xs text-white truncate w-32">{inv.file_url.split('/').pop() || "invoice.pdf"}</p>
                        <p className="font-mono text-[10px] text-slate-500 mt-0.5">Vendor Payout</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                      inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      inv.status === 'approved' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      inv.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-white/5 text-slate-400 border border-white/10'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  {inv.feedback && (
                    <div className="mt-3 pt-3 border-t border-white/5 font-mono text-[10px] text-slate-400">
                      <span className="text-purple-400 opacity-80">&gt; LLM_Note:</span> {inv.feedback}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Middle Column (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Live Logs */}
        <LiveLogs decisions={decisions} />
        {/* Scanner */}
        <Scanner 
          events={events} 
          selectedEventId={selectedEventId} 
          onSelectEvent={onSelectEvent} 
          onCheckIn={onCheckIn} 
        />
      </div>

      {/* Right Column (4 cols) */}
      <div className="lg:col-span-4">
        {/* Create Event Form */}
        <CreateEventForm onCreateEvent={onCreateEvent} />
      </div>
    </div>
  );
}
