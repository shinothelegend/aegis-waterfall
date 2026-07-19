import { useState } from 'react';
import type { EventItem } from '../hooks/useCheckpointData';

interface EscrowDetailsProps {
  selectedEvent: EventItem;
  isConnected: boolean;
  userAddress?: string;
  onChainEvent: any;
  hasDeposited: boolean;
  hasCheckedIn: boolean;
  hasRefunded: boolean;
  usdcAllowance: bigint | undefined;
  rsvps: any[];
  onBack: () => void;
  onDeposit: () => void;
  onUploadInvoice: (amount: string, fileUrl: string) => void;
}

export function EscrowDetails({
  selectedEvent,
  isConnected,
  userAddress,
  onChainEvent,
  hasDeposited,
  hasCheckedIn,
  hasRefunded,
  usdcAllowance,
  rsvps,
  onBack,
  onDeposit,
  onUploadInvoice
}: EscrowDetailsProps) {
  const [invoiceAmount, setInvoiceAmount] = useState('5');
  const [invoiceFileUrl, setInvoiceFileUrl] = useState('https://ipfs.io/ipfs/QmInvoicePlaceholderHex');

  const handleInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUploadInvoice(invoiceAmount, invoiceFileUrl);
  };

  const priceAmount = selectedEvent.ticket_price;
  const priceUnits = BigInt(priceAmount * 10 ** 6);
  const needsApproval = !usdcAllowance || usdcAllowance < priceUnits;

  // Filter RSVPs
  const eventRsvps = rsvps.filter(r => r.event_id === selectedEvent.id);

  return (
    <div>
      <button 
        onClick={onBack}
        className="text-xs text-slate-400 hover:text-white mb-6 flex items-center gap-1 font-semibold"
      >
        &larr; Back to Catalog
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Details and Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel border border-white/10 rounded-xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/5 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-white">{selectedEvent.title}</h2>
                <p className="text-slate-400 mt-2 text-sm">{selectedEvent.description}</p>
              </div>
              <div className="p-4 bg-[#050505] rounded-xl border border-white/5 text-right">
                <p className="text-[9px] text-slate-500 font-bold tracking-wider uppercase">USDC ESCROW DEPOSIT</p>
                <p className="text-xl font-black text-cyan-400 mt-1">{selectedEvent.ticket_price} USDC</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 border-y border-white/10 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400">calendar_today</span>
                <div>
                  <p className="text-slate-500 text-[9px] font-bold font-mono">DATE</p>
                  <p>{new Date(selectedEvent.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">location_on</span>
                <div>
                  <p className="text-slate-500 text-[9px] font-bold font-mono">LOCATION</p>
                  <p>{selectedEvent.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-pink-500">timer</span>
                <div>
                  <p className="text-slate-500 text-[9px] font-bold font-mono">EXPIRES</p>
                  <p>{new Date(selectedEvent.end_time * 1000).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-[#050505] p-4 rounded-xl border border-white/5">
              <div className="text-[11px] text-slate-400">
                <p className="font-bold text-slate-300 font-mono">Organizer Address</p>
                <p className="font-mono mt-0.5">{selectedEvent.organizer}</p>
              </div>
              <div className="text-[11px] text-slate-400 text-right">
                <p className="font-bold text-slate-300 font-mono">On-Chain Escrow Balance</p>
                <p className="font-mono text-cyan-400 font-extrabold mt-0.5">
                  {onChainEvent ? (Number(onChainEvent[4]) / 10**6).toFixed(2) : "0.00"} USDC
                </p>
              </div>
            </div>
          </div>

          {/* RSVPs Table */}
          <div className="glass-panel border border-white/10 rounded-xl p-6">
            <h3 className="text-sm font-bold mb-4 font-mono">Event RSVPs & Escrow Statuses</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold font-mono">
                    <th className="py-3">Attendee Wallet</th>
                    <th className="py-3 text-center">Escrow Value</th>
                    <th className="py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {eventRsvps.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-500">No RSVPs detected for this event escrow.</td>
                    </tr>
                  ) : (
                    eventRsvps.map((rsvp, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 font-mono">{rsvp.attendee}</td>
                        <td className="py-3 text-center text-cyan-400 font-semibold">{selectedEvent.ticket_price} USDC</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            rsvp.status === 'refunded' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            rsvp.status === 'checked_in' ? 'bg-amber-900/20 text-amber-400 border border-amber-800/30' :
                            rsvp.status === 'flagged_fraud' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}>
                            {rsvp.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col - Deposit & Invoices */}
        <div className="space-y-6">
          {/* Deposit Card */}
          <div className="glass-panel border border-white/10 rounded-xl p-6 relative overflow-hidden">
            <h3 className="font-title-md text-sm font-semibold mb-2 flex items-center gap-2 text-cyan-400">
              <span className="material-symbols-outlined">qr_code_scanner</span>
              Deposit Ticket Escrow
            </h3>
            <p className="text-[11px] text-slate-400 mb-6">Escrow the ticket fee in USDC. The autonomous agent will automatically issue a refund directly back to your address the second you check in.</p>

            {!isConnected ? (
              <div className="p-4 bg-[#050505] rounded-xl border border-white/5 text-center">
                <p className="text-xs text-slate-400 mb-3 font-mono">Connect wallet to deposit escrow</p>
              </div>
            ) : (
              <div className="space-y-4">
                {hasRefunded ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <span className="material-symbols-outlined text-3xl text-emerald-400 mb-2">task_alt</span>
                    <h4 className="font-bold text-emerald-400 text-sm font-mono">Escrow Refunded</h4>
                    <p className="text-[10px] text-emerald-400/70 mt-1 font-mono">Arrival verified. Autonomous refund processed instantly on-chain.</p>
                  </div>
                ) : hasCheckedIn ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                    <span className="material-symbols-outlined text-3xl text-amber-400 mb-2">autorenew</span>
                    <h4 className="font-bold text-amber-400 text-sm font-mono">Arrival Confirmed</h4>
                    <p className="text-[10px] text-amber-400/70 mt-1 font-mono">Daemon is executing anti-fraud checks and processing refund...</p>
                  </div>
                ) : hasDeposited ? (
                  <div className="p-4 bg-[#050505] rounded-xl border border-white/5 text-center space-y-3">
                    <div className="inline-block p-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-cyan-400">
                      <span className="material-symbols-outlined text-xl">qr_code</span>
                    </div>
                    <h4 className="font-bold text-white text-sm font-mono">Escrow Locked</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Scan your wallet address QR code at the event gate to check in:</p>
                    <div className="bg-white p-3 rounded-lg inline-block shadow-md">
                      <svg className="w-28 h-28 text-slate-950" viewBox="0 0 100 100">
                        <rect width="20" height="20" fill="currentColor"/>
                        <rect x="80" width="20" height="20" fill="currentColor"/>
                        <rect y="80" width="20" height="20" fill="currentColor"/>
                        <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="6"/>
                        <rect x="35" y="35" width="30" height="30" fill="currentColor"/>
                        <rect x="40" y="80" width="20" height="20" fill="currentColor"/>
                        <rect x="80" y="40" width="20" height="20" fill="currentColor"/>
                      </svg>
                    </div>
                    <p className="text-[9px] font-mono text-slate-400 truncate mt-1">{userAddress}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-[#050505] border border-white/5 rounded-xl text-center text-xs">
                      <span className="text-slate-400">Required: </span>
                      <span className="text-white font-bold">{selectedEvent.ticket_price} USDC</span>
                    </div>
                    <button 
                      onClick={onDeposit}
                      className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold py-3 rounded-xl transition text-xs shadow-lg active:scale-95"
                    >
                      {needsApproval ? "Approve USDC Escrow" : "Lock Escrow & RSVP"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vendor Invoice Card */}
          <div className="glass-panel border border-white/10 rounded-xl p-6">
            <h3 className="font-title-md text-sm font-semibold mb-2 flex items-center gap-2 text-purple-400">
              <span className="material-symbols-outlined">description</span>
              Request Vendor Payout
            </h3>
            <p className="text-[11px] text-slate-400 mb-6">Submit your vendor invoice. The AI agent will review it against the rubric and queue it for payout.</p>

            {!isConnected ? (
              <p className="text-xs text-slate-500 text-center py-4 font-mono">Connect wallet to request payout</p>
            ) : (
              <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase font-mono">Requested Payout (USDC)</label>
                  <input 
                    type="number" 
                    placeholder="Amount" 
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase font-mono">Invoice Document URL</label>
                  <input 
                    type="text" 
                    placeholder="File URL" 
                    value={invoiceFileUrl}
                    onChange={(e) => setInvoiceFileUrl(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold py-2.5 rounded-lg transition text-xs"
                >
                  Submit Payout Request
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
