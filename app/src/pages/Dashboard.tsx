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
          <div className="glass-panel rounded-xl p-6 border border-zinc-800 shadow-2xl relative overflow-hidden group hover:border-zinc-500 transition-colors duration-300">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-zinc-800 group-hover:bg-white transition-colors duration-300"></div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-brand flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                Escrowed USDC
              </h4>
              <span className="material-symbols-outlined text-zinc-400 text-base">lock</span>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-white text-glow-cyan font-brand">
                <AnimatedNumber value={totalEscrowed} />
              </span>
              <span className="text-[10px] text-zinc-500 ml-2 font-brand uppercase font-bold">LOCKED</span>
            </div>
            <p className="text-xs text-zinc-500 mt-3 font-brand leading-relaxed">Held in treasury, pending check-in</p>
          </div>

          {/* Card 2: Refunded */}
          <div className="glass-panel rounded-xl p-6 border border-zinc-800 shadow-2xl relative overflow-hidden group hover:border-zinc-500 transition-colors duration-300">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-zinc-800 group-hover:bg-white transition-colors duration-300"></div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-brand flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                Refunded USDC
              </h4>
              <span className="material-symbols-outlined text-zinc-400 text-base">assignment_return</span>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-white text-glow-cyan font-brand">
                <AnimatedNumber value={totalRefunded} />
              </span>
              <span className="text-[10px] text-zinc-500 ml-2 font-brand uppercase font-bold">Disbursed</span>
            </div>
            <p className="text-xs text-zinc-500 mt-3 font-brand leading-relaxed">Returned to checked-in wallets</p>
          </div>

          {/* Card 3: Settled Payouts */}
          <div className="glass-panel rounded-xl p-6 border border-zinc-800 shadow-2xl relative overflow-hidden group hover:border-zinc-500 transition-colors duration-300">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-zinc-800 group-hover:bg-white transition-colors duration-300"></div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-brand flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                Settled Payouts
              </h4>
              <span className="material-symbols-outlined text-zinc-400 text-base">account_balance_wallet</span>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-white text-glow-cyan font-brand">
                <AnimatedNumber value={totalSettled} />
              </span>
              <span className="text-[10px] text-zinc-500 ml-2 font-brand uppercase font-bold">Settled</span>
            </div>
            <p className="text-xs text-zinc-500 mt-3 font-brand leading-relaxed">Approved vendor payouts executed</p>
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
          <div className="glass-panel rounded-xl p-6 border border-zinc-800 flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-4">
              <div>
                <h3 className="font-brand text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-white text-sm font-bold">receipt_long</span>
                  AI Audit Queue
                </h3>
                <p className="text-[10px] text-zinc-500 font-brand mt-0.5">Click invoice card to review details</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 terminal-scroll">
              {invoices.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <span className="material-symbols-outlined text-4xl text-zinc-800 mb-2">description</span>
                  <p className="text-sm text-zinc-600 font-brand">No vendor invoices loaded in queue.</p>
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
                      className={`bg-zinc-950/60 border rounded-xl p-4 transition-all duration-300 cursor-pointer ${
                        isExpanded ? 'border-zinc-500 bg-zinc-900/50' : 'border-zinc-900 hover:border-zinc-800'
                      }`}
                      onClick={() => setActiveInvoiceId(isExpanded ? null : inv.id)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-zinc-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                          </div>
                          <div>
                            <p className="font-brand text-xs text-white truncate w-28 md:w-36 font-semibold">
                              {inv.file_url.split('/').pop() || "invoice.pdf"}
                            </p>
                            <p className="font-brand text-[10px] text-zinc-400 mt-1">
                              Claim: <span className="font-bold text-white">{Number(inv.amount).toFixed(2)} USDC</span>
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-brand border ${
                          isPaid ? 'bg-white text-black border-white' :
                          isApproved ? 'bg-white text-black border-white' :
                          isRejected ? 'bg-zinc-900 text-zinc-500 border-zinc-800' :
                          'bg-zinc-900 text-zinc-400 border-zinc-800'
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
                        <div className="mt-2.5 text-[10px] font-brand text-zinc-500">
                          &gt; Click to view LLM reasoning audit report
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
