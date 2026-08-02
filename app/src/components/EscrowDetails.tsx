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
    <div className="font-brand">
      <button 
        onClick={onBack}
        className="text-xs text-zinc-400 hover:text-white mb-6 flex items-center gap-1 font-semibold uppercase tracking-wider font-brand"
      >
        &larr; Back to Catalog
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-brand">
        {/* Left Col - Details and Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel border border-zinc-800 rounded-xl p-8 relative overflow-hidden bg-zinc-950/80">
            <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-white uppercase tracking-wider">{selectedEvent.title}</h2>
                <p className="text-zinc-400 mt-2 text-sm font-body leading-relaxed">{selectedEvent.description}</p>
              </div>
              <div className="p-4 bg-black rounded-xl border border-zinc-800 text-right">
                <p className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase">USDC ESCROW DEPOSIT</p>
                <p className="text-xl font-black text-white mt-1">{selectedEvent.ticket_price} USDC</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 border-y border-zinc-800 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white">calendar_today</span>
                <div>
                  <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider">DATE</p>
                  <p className="mt-0.5">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white">location_on</span>
                <div>
                  <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider">LOCATION</p>
                  <p className="mt-0.5">{selectedEvent.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white">timer</span>
                <div>
                  <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider">EXPIRES</p>
                  <p className="mt-0.5">{new Date(selectedEvent.end_time * 1000).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-black p-4 rounded-xl border border-zinc-800">
              <div className="text-[11px] text-zinc-400">
                <p className="font-bold text-zinc-500 uppercase tracking-wider text-[9px]">Organizer Address</p>
                <p className="mt-0.5">{selectedEvent.organizer}</p>
              </div>
              <div className="text-[11px] text-zinc-400 text-right">
                <p className="font-bold text-zinc-500 uppercase tracking-wider text-[9px]">On-Chain Escrow Balance</p>
                <p className="text-white font-extrabold mt-0.5">
                  {onChainEvent ? (Number(onChainEvent[4]) / 10**6).toFixed(2) : "0.00"} USDC
                </p>
              </div>
            </div>
          </div>

          {/* RSVPs Table */}
          <div className="glass-panel border border-zinc-800 rounded-xl p-6 bg-zinc-950/80">
            <h3 className="text-xs font-bold mb-4 uppercase tracking-widest text-white">Event RSVPs & Escrow Statuses</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest font-bold">
                    <th className="py-3">Attendee Wallet</th>
                    <th className="py-3 text-center">Escrow Value</th>
                    <th className="py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {eventRsvps.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-zinc-500">No RSVPs detected for this event escrow.</td>
                    </tr>
                  ) : (
                    eventRsvps.map((rsvp, idx) => (
                      <tr key={idx} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                        <td className="py-3 font-brand text-zinc-300">{rsvp.attendee}</td>
                        <td className="py-3 text-center text-white font-bold">{selectedEvent.ticket_price} USDC</td>
                        <td className="py-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                            rsvp.status === 'refunded' ? 'bg-white text-black border-white' :
                            rsvp.status === 'checked_in' ? 'bg-zinc-900 text-zinc-400 border-zinc-800' :
                            rsvp.status === 'flagged_fraud' ? 'bg-zinc-950 text-zinc-600 border-zinc-900' :
                            'bg-zinc-900 text-zinc-400 border-zinc-800'
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
          <div className="glass-panel border border-zinc-800 rounded-xl p-6 bg-zinc-950/80 relative overflow-hidden">
            <h3 className="text-xs font-bold mb-2 flex items-center gap-2 uppercase tracking-wider text-white">
              <span className="material-symbols-outlined text-base">qr_code_scanner</span>
              Deposit Ticket Escrow
            </h3>
            <p className="text-[11px] text-zinc-400 mb-6 font-body leading-relaxed">Escrow the ticket fee in USDC. The autonomous agent will automatically issue a refund directly back to your address the second you check in.</p>

            {!isConnected ? (
              <div className="p-4 bg-black rounded-xl border border-zinc-800 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold font-brand">Connect wallet to deposit escrow</p>
              </div>
            ) : (
              <div className="space-y-4">
                {hasRefunded ? (
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
                    <span className="material-symbols-outlined text-3xl text-white mb-2">task_alt</span>
                    <h4 className="font-bold text-white text-sm uppercase tracking-wider">Escrow Refunded</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">Arrival verified. Autonomous refund processed instantly on-chain.</p>
                  </div>
                ) : hasCheckedIn ? (
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
                    <span className="material-symbols-outlined text-3xl text-zinc-500 mb-2 animate-spin">autorenew</span>
                    <h4 className="font-bold text-zinc-400 text-sm uppercase tracking-wider">Arrival Confirmed</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">Daemon is executing anti-fraud checks and processing refund...</p>
                  </div>
                ) : hasDeposited ? (
                  <div className="p-4 bg-black rounded-xl border border-zinc-800 text-center space-y-3">
                    <div className="inline-block p-2 bg-zinc-900 border border-zinc-800 rounded-full text-white">
                      <span className="material-symbols-outlined text-xl">qr_code</span>
                    </div>
                    <h4 className="font-bold text-white text-sm uppercase tracking-wider">Escrow Locked</h4>
                    <p className="text-[10px] text-zinc-400 font-body">Scan your wallet address QR code at the event gate to check in:</p>
                    <div className="bg-white p-3 rounded-lg inline-block border border-zinc-300">
                      <svg className="w-28 h-28 text-black" viewBox="0 0 100 100">
                        <rect width="20" height="20" fill="currentColor"/>
                        <rect x="80" width="20" height="20" fill="currentColor"/>
                        <rect y="80" width="20" height="20" fill="currentColor"/>
                        <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="6"/>
                        <rect x="35" y="35" width="30" height="30" fill="currentColor"/>
                        <rect x="40" y="80" width="20" height="20" fill="currentColor"/>
                        <rect x="80" y="40" width="20" height="20" fill="currentColor"/>
                      </svg>
                    </div>
                    <p className="text-[9px] text-zinc-500 truncate mt-1">{userAddress}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-black border border-zinc-800 rounded-xl text-center text-xs">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider">Required: </span>
                      <span className="text-white font-bold">{selectedEvent.ticket_price} USDC</span>
                    </div>
                    <button 
                      onClick={onDeposit}
                      className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-xl transition text-xs uppercase tracking-wider"
                    >
                      {needsApproval ? "Approve USDC Escrow" : "Lock Escrow & RSVP"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vendor Invoice Card */}
          <div className="glass-panel border border-zinc-800 rounded-xl p-6 bg-zinc-950/80 font-brand">
            <h3 className="text-xs font-bold mb-2 flex items-center gap-2 uppercase tracking-wider text-white">
              <span className="material-symbols-outlined">description</span>
              Request Vendor Payout
            </h3>
            <p className="text-[11px] text-zinc-400 mb-6 font-body leading-relaxed">Submit your vendor invoice. The AI agent will review it against the rubric and queue it for payout.</p>

            {!isConnected ? (
              <p className="text-xs text-zinc-500 text-center py-4 uppercase tracking-widest font-bold">Connect wallet to request payout</p>
            ) : (
              <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] text-zinc-500 font-bold mb-1 tracking-wider uppercase">Requested Payout (USDC)</label>
                  <input 
                    type="number" 
                    placeholder="Amount" 
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-brand"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-zinc-500 font-bold mb-1 tracking-wider uppercase">Invoice Document URL</label>
                  <input 
                    type="text" 
                    placeholder="File URL" 
                    value={invoiceFileUrl}
                    onChange={(e) => setInvoiceFileUrl(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs font-brand text-white focus:outline-none focus:border-white"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold py-2.5 rounded-lg transition text-xs uppercase tracking-wider font-brand"
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
