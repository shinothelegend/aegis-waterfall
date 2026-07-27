import { useState } from 'react';
import { LiveLogs } from '../components/LiveLogs';
import { CreateEventForm } from '../components/CreateEventForm';
import { Scanner } from '../components/Scanner';
import { AutonomyProofPanel } from '../components/AutonomyProofPanel';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { LLMInvoiceReview } from '../components/LLMInvoiceReview';
import { DashboardSkeleton } from '../components/Skeletons';
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
  userAddress?: string;
  loading: boolean;
}

export function Dashboard({
  events,
  decisions,
  invoices,
  rsvps,
  selectedEventId,
  onSelectEvent,
  onCheckIn,
  onCreateEvent,
  userAddress,
  loading
}: DashboardProps) {
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Calculate actual financial values from Supabase state
  const getRsvpPrice = (rsvp: any) => {
    const ev = events.find(e => e.id === rsvp.event_id);
    return ev ? Number(ev.ticket_price) : 50; // Fallback to 50 USDC if not matched
  };

  // 1. Escrow Locked (Status: deposited or checked_in)
  const totalEscrowed = rsvps
    .filter(r => r.status === 'deposited' || r.status === 'checked_in')
    .reduce((sum, r) => sum + getRsvpPrice(r), 0);

  // 2. Autonomously Refunded (Status: refunded)
  const totalRefunded = rsvps
    .filter(r => r.status === 'refunded' || r.status === 'processed')
    .reduce((sum, r) => sum + getRsvpPrice(r), 0);

  // 3. Settled Vendor Payouts (Invoice Status: paid)
  const totalSettled = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left Column (8 cols): Metrics & Live Process Audits */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* Treasury metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Locked Escrow */}
          <div className="glass-panel rounded-xl p-5 border border-cyan-500/10 shadow-[0_4px_20px_rgba(6,182,212,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500/20 via-cyan-500 to-cyan-500/20"></div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Escrowed USDC
              </h4>
              <span className="material-symbols-outlined text-cyan-400 text-sm">lock</span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white text-glow-cyan">
                <AnimatedNumber value={totalEscrowed} />
              </span>
              <span className="text-[10px] text-slate-500 ml-1.5 font-mono uppercase">LOCKED</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-2 font-mono">Held in treasury, pending check-in refund</p>
          </div>

          {/* Card 2: Refunded */}
          <div className="glass-panel rounded-xl p-5 border border-emerald-500/10 shadow-[0_4px_20px_rgba(16,185,129,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500/20 via-emerald-500 to-emerald-500/20"></div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Refunded USDC
              </h4>
              <span className="material-symbols-outlined text-emerald-400 text-sm">assignment_return</span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white text-glow-cyan" style={{ textShadow: "0 0 10px rgba(16,185,129,0.5)" }}>
                <AnimatedNumber value={totalRefunded} />
              </span>
              <span className="text-[10px] text-slate-500 ml-1.5 font-mono uppercase">Disbursed</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-2 font-mono">Autonomously returned to check-in wallets</p>
          </div>

          {/* Card 3: Settled Payouts */}
          <div className="glass-panel rounded-xl p-5 border border-amber-500/10 shadow-[0_4px_20px_rgba(245,158,11,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/20 via-amber-500 to-amber-500/20"></div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Settled Payouts
              </h4>
              <span className="material-symbols-outlined text-amber-400 text-sm">account_balance_wallet</span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white text-glow-amber">
                <AnimatedNumber value={totalSettled} />
              </span>
              <span className="text-[10px] text-slate-500 ml-1.5 font-mono uppercase">Settled</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-2 font-mono">LLM approved payouts paid to vendors</p>
          </div>
        </div>

        {/* Dynamic Process Stepper and Audit Queue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Autonomy Proof panel */}
          <AutonomyProofPanel 
            selectedEventId={selectedEventId} 
            rsvps={rsvps} 
            userAddress={userAddress} 
          />

          {/* Audit Queue / LLM Invoice reviewers */}
          <div className="glass-panel rounded-xl p-6 border border-white/5 flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div>
                <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-500 text-sm font-bold">receipt_long</span>
                  AI Audit Queue
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Click invoice card to review LLM reasoning</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 status-dot-active" style={{ animationName: 'pulse-cyan', animationDuration: '2s' }}></div>
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 terminal-scroll">
              {invoices.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <span className="material-symbols-outlined text-4xl text-slate-700 mb-2">description</span>
                  <p className="text-xs text-slate-500 font-mono">No vendor invoices loaded in queue.</p>
                </div>
              ) : (
                invoices.map((inv) => {
                  const isExpanded = activeInvoiceId === inv.id;
                  const isPaid = inv.status === 'paid';
                  const isApproved = inv.status === 'approved';
                  const isRejected = inv.status === 'rejected';

                  return (
                    <div 
                      key={inv.id} 
                      className={`bg-[#05070d]/60 border rounded-xl p-4 transition-all duration-300 cursor-pointer ${
                        isExpanded ? 'border-cyan-500/40 bg-[#070b14]' : 'border-white/5 hover:border-white/20'
                      }`}
                      onClick={() => setActiveInvoiceId(isExpanded ? null : inv.id)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/5 rounded border border-white/5 text-slate-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                          </div>
                          <div>
                            <p className="font-mono text-[11px] text-white truncate w-28 md:w-36">
                              {inv.file_url.split('/').pop() || "invoice.pdf"}
                            </p>
                            <p className="font-mono text-[9px] text-slate-500 mt-0.5">
                              Claim: <span className="font-bold text-slate-300">{Number(inv.amount).toFixed(2)} USDC</span>
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono border ${
                          isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          isApproved ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                          isRejected ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-white/5 text-slate-400 border-white/10'
                        }`}>
                          {inv.status}
                        </span>
                      </div>

                      {/* Expandable LLM terminal typewriter detail */}
                      {isExpanded && inv.feedback && (
                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                          <LLMInvoiceReview 
                            feedback={inv.feedback} 
                            status={inv.status} 
                            amount={Number(inv.amount)} 
                            vendorAddress={inv.vendor_address} 
                          />
                        </div>
                      )}

                      {!isExpanded && inv.feedback && (
                        <div className="mt-2 text-[9px] font-mono text-slate-500 truncate">
                          &gt; click to view LLM reasoning audit report
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (4 cols): System Feeds & Check-Ins */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Live daemon logs */}
        <LiveLogs decisions={decisions} />

        {/* Scanner controller */}
        <Scanner 
          events={events} 
          selectedEventId={selectedEventId} 
          onSelectEvent={onSelectEvent} 
          onCheckIn={onCheckIn} 
        />

        {/* Escrow deployment form */}
        <CreateEventForm onCreateEvent={onCreateEvent} />
      </div>

    </div>
  );
}
