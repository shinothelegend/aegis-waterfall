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

  const eventRsvps = selectedEventId ? rsvps.filter(r => r.event_id === selectedEventId) : rsvps;
  const userRsvp = userAddress ? eventRsvps.find(r => r.attendee.toLowerCase() === userAddress.toLowerCase()) : null;
  const activeRsvp = userRsvp || (eventRsvps.length > 0 ? eventRsvps[0] : null);

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
      activeColor: "border-white text-white bg-zinc-900",
    },
    {
      id: 1,
      title: "2. Check-In Emitted",
      role: "Gatekeeper Sign-in",
      desc: "Staff logs attendee arrival, emitting a CheckedIn log on-chain.",
      icon: "qr_code_2",
      badge: "Check-In Verified",
      activeColor: "border-white text-white bg-zinc-900",
    },
    {
      id: 2,
      title: "3. Autonomous Refund",
      role: "AI Agent (Server-side Signature)",
      desc: "Agent wallet detects on-chain check-in event, signs and executes refund.",
      icon: "smart_toy",
      badge: "Agent Processing",
      activeColor: "border-zinc-500 text-zinc-300 bg-zinc-800",
    },
    {
      id: 3,
      title: "4. SBT Attestation Mint",
      role: "Agent Metadata Write",
      desc: "On-chain Soulbound NFT is minted. Agent writes refund transaction proof to token metadata.",
      icon: "workspace_premium",
      badge: "Completed",
      activeColor: "border-white text-white bg-zinc-900",
    }
  ];

  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden flex flex-col h-[520px] border border-zinc-800">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-4">
        <div>
          <h3 className="font-brand text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-white text-sm">route</span>
            Escrow Autonomy Pipeline
          </h3>
          <p className="text-[10px] text-zinc-500 font-brand mt-0.5">Live tracking: {activeRsvp ? `${rsvpAddr.substring(0, 8)}...` : "Demo Mode"}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
          </span>
          <span className="font-brand text-[9px] text-white uppercase font-bold">DAEMON LOGGED</span>
        </div>
      </div>

      {/* Timeline steps */}
      <div className="flex-1 flex flex-col justify-between py-2 relative">
        {/* Connection pipeline line */}
        <div className="absolute left-[17px] top-[24px] bottom-[24px] w-0.5 bg-zinc-900">
          {/* Animated active pipeline filler */}
          {currentStep > 0 && (
            <motion.div 
              className="w-full bg-white"
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
                    isCompleted ? 'border-white bg-zinc-950 text-white' :
                    isActive ? step.activeColor + ' scale-105' :
                    'border-zinc-900 bg-zinc-950 text-zinc-600'
                  }`}
                  animate={isActive ? { boxShadow: "0 0 12px rgba(255, 255, 255, 0.2)" } : {}}
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
                  <h4 className={`text-xs font-brand font-bold uppercase tracking-wider ${isActive ? 'text-white' : isCompleted ? 'text-zinc-200' : 'text-zinc-500'}`}>
                    {step.title}
                  </h4>
                  {isActive && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white text-black border border-white">
                      {step.badge}
                    </span>
                  )}
                  {isCompleted && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-zinc-400 border border-zinc-800">
                      Executed
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed font-body">
                  {step.desc}
                </p>
                {step.id === 0 && activeRsvp && (
                  <div className="mt-1.5 font-brand text-[10px] text-white/80 truncate">
                    Escrow: {activeRsvp.status} | Tx: {depositTx ? `${depositTx.substring(0, 14)}...` : 'Pending'}
                  </div>
                )}
                {step.id === 2 && isCompleted && (
                  <div className="mt-1.5 font-brand text-[10px] text-zinc-400 font-semibold">
                    Agent Signature Verified
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent details */}
      <div className="mt-4 pt-4 border-t border-zinc-900 bg-zinc-950 p-3.5 rounded-lg flex items-center justify-between text-xs font-brand">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[13px] text-white">lock_open</span>
            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">AGENT CONTRACT SIGNER</span>
          </div>
          <p className="text-zinc-300 truncate w-40 md:w-56 mt-1 text-[11px] md:text-xs">{agentWallet}</p>
        </div>
        <button 
          onClick={handleCopyAgentWallet}
          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1.5 rounded text-zinc-300 flex items-center gap-1.5 active:scale-95 transition-all text-[10px] md:text-xs font-bold uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-xs md:text-sm">{copied ? 'done' : 'content_copy'}</span>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
