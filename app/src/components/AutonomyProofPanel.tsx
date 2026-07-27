import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface AutonomyProofPanelProps {
  selectedEventId: string | null;
  rsvps: any[];
  userAddress?: string;
}

export function AutonomyProofPanel({ selectedEventId, rsvps, userAddress }: AutonomyProofPanelProps) {
  const [copied, setCopied] = useState(false);
  const agentWallet = "0x59e096c540e1ec640bd203012b8525d9fe04eccf";

  const handleCopyAgentWallet = () => {
    navigator.clipboard.writeText(agentWallet);
    setCopied(true);
    toast.success("Agent wallet address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Find the RSVP to show in the timeline:
  // Prefer the active user's RSVP for the selected event, otherwise the latest RSVP for this event, otherwise any latest RSVP.
  const eventRsvps = selectedEventId ? rsvps.filter(r => r.event_id === selectedEventId) : rsvps;
  const userRsvp = userAddress ? eventRsvps.find(r => r.attendee.toLowerCase() === userAddress.toLowerCase()) : null;
  const activeRsvp = userRsvp || (eventRsvps.length > 0 ? eventRsvps[0] : null);

  // Determine current step based on RSVP status
  // 0: No RSVP, 1: Deposited (Escrow Locked), 2: Checked In (Check-in Emitted), 3: Refunded/SBT Minted (Complete)
  let currentStep = 0;
  let rsvpAddr = activeRsvp?.attendee || "0x0000...0000";
  let depositTx = activeRsvp?.tx_hash || null;

  if (activeRsvp) {
    if (activeRsvp.status === 'deposited') {
      currentStep = 1;
    } else if (activeRsvp.status === 'checked_in') {
      currentStep = 2;
    } else if (activeRsvp.status === 'refunded' || activeRsvp.status === 'processed') {
      currentStep = 3;
    }
  }

  const steps = [
    {
      id: 0,
      title: "1. USDC Escrow Lock",
      role: "User Action",
      desc: "Attendee locks USDC ticket fee in the EventTreasury smart contract.",
      icon: "lock",
      badge: "Escrow Active",
      activeColor: "border-cyan-400 text-cyan-400 bg-cyan-950/20",
    },
    {
      id: 1,
      title: "2. Check-In Emitted",
      role: "Gatekeeper Sign-in",
      desc: "Staff logs attendee arrival, emitting a CheckedIn log on-chain.",
      icon: "qr_code_2",
      badge: "Check-In Verified",
      activeColor: "border-cyan-400 text-cyan-400 bg-cyan-950/20",
    },
    {
      id: 2,
      title: "3. Autonomous Refund",
      role: "AI Agent (Server-side Signature)",
      desc: "Agent wallet detects on-chain check-in event, signs and executes refund.",
      icon: "smart_toy",
      badge: "Agent Processing",
      activeColor: "border-amber-400 text-amber-400 bg-amber-950/20",
    },
    {
      id: 3,
      title: "4. SBT Attestation Mint",
      role: "Agent Metadata Write",
      desc: "On-chain Soulbound NFT is minted. Agent writes refund transaction proof to token metadata.",
      icon: "workspace_premium",
      badge: "Completed",
      activeColor: "border-cyan-400 text-cyan-400 bg-cyan-950/20",
    }
  ];

  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden flex flex-col h-[520px] border border-white/5">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl"></div>

      <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
        <div>
          <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-cyan-400 text-sm">route</span>
            Escrow Autonomy Pipeline
          </h3>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Live tracking: {activeRsvp ? `${rsvpAddr.substring(0, 8)}...` : "Demo Mode"}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#050508] px-2 py-0.5 rounded border border-cyan-500/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
          </span>
          <span className="font-mono text-[9px] text-cyan-400 uppercase font-bold">DAEMON LOGGED</span>
        </div>
      </div>

      {/* Timeline steps */}
      <div className="flex-1 flex flex-col justify-between py-2 relative">
        {/* Connection pipeline line */}
        <div className="absolute left-[17px] top-[24px] bottom-[24px] w-0.5 bg-white/5">
          {/* Animated active pipeline filler */}
          {currentStep > 0 && (
            <motion.div 
              className="w-full bg-gradient-to-b from-cyan-400 to-cyan-500"
              initial={{ height: 0 }}
              animate={{ height: `${(currentStep / 3) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          )}
        </div>

        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="flex gap-4 relative z-10">
              {/* Stepper node */}
              <div className="flex flex-col items-center">
                <motion.div 
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                    isCompleted ? 'border-cyan-400 bg-[#030712] text-cyan-400' :
                    isActive ? step.activeColor + ' scale-105' :
                    'border-white/10 bg-[#050508] text-slate-600'
                  }`}
                  animate={isActive ? { boxShadow: "0 0 12px rgba(6, 182, 212, 0.3)" } : {}}
                  transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                >
                  <span className="material-symbols-outlined text-sm font-bold">
                    {isCompleted ? 'check' : step.icon}
                  </span>
                </motion.div>
              </div>

              {/* Stepper content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`text-xs font-mono font-bold ${isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-600'}`}>
                    {step.title}
                  </h4>
                  {isActive && (
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      step.id === 2 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}>
                      {step.badge}
                    </span>
                  )}
                  {isCompleted && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-cyan-950/30 text-cyan-400 border border-cyan-800/20">
                      Executed
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed font-sans">
                  {step.desc}
                </p>
                {step.id === 0 && activeRsvp && (
                  <div className="mt-1 font-mono text-[9px] text-cyan-400/80 truncate">
                    Escrow: {activeRsvp.status} | Tx: {depositTx ? `${depositTx.substring(0, 14)}...` : 'Pending'}
                  </div>
                )}
                {step.id === 2 && isCompleted && (
                  <div className="mt-1 font-mono text-[9px] text-amber-400/80">
                    Agent Signature Verified
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent details */}
      <div className="mt-4 pt-4 border-t border-white/5 bg-[#050508]/60 p-3 rounded-lg flex items-center justify-between text-[10px] font-mono">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px] text-cyan-400">lock_open</span>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">AGENT CONTRACT SIGNER</span>
          </div>
          <p className="text-slate-300 truncate w-40 md:w-56 mt-0.5">{agentWallet}</p>
        </div>
        <button 
          onClick={handleCopyAgentWallet}
          className="bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded text-slate-300 flex items-center gap-1 active:scale-95 transition-all text-[9px]"
        >
          <span className="material-symbols-outlined text-[11px]">{copied ? 'done' : 'content_copy'}</span>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
