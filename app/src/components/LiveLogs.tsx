import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AgentDecision } from '../hooks/useCheckpointData';
import toast from 'react-hot-toast';

interface LiveLogsProps {
  decisions: AgentDecision[];
}

export function LiveLogs({ decisions }: LiveLogsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getLogStyle = (dec: AgentDecision) => {
    if (dec.decision === 'rejected') {
      return {
        badgeBg: 'bg-zinc-900 text-zinc-500 border-zinc-800',
        textStyle: 'text-zinc-400',
        prefix: '🛑 [Blocked/Flagged]'
      };
    }
    if (dec.trigger_type === 'settle') {
      return {
        badgeBg: 'bg-white text-black border-white',
        textStyle: 'text-zinc-300 font-semibold',
        prefix: '🏦 [Settle Payout]'
      };
    }
    if (dec.trigger_type === 'invoice_approval') {
      return {
        badgeBg: 'bg-white text-black border-white',
        textStyle: 'text-zinc-300 font-semibold',
        prefix: '📄 [Invoice Audit]'
      };
    }
    return {
      badgeBg: 'bg-zinc-900 text-white border-zinc-800',
      textStyle: 'text-zinc-300',
      prefix: '🤖 [Auto Refund]'
    };
  };

  const handleCopyHash = (txHash: string, decId: string) => {
    navigator.clipboard.writeText(txHash);
    setCopiedId(decId);
    toast.success("Transaction proof copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="glass-panel rounded-xl border border-zinc-800 flex flex-col h-[350px] overflow-hidden">
      <div className="bg-zinc-950 border-b border-zinc-900 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white text-sm">terminal</span>
          <span className="font-brand text-xs text-zinc-300 font-bold uppercase tracking-wider">Autonomous Agent logs</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
          <span className="font-brand text-[10px] text-zinc-500 uppercase font-bold">Live Link</span>
        </div>
      </div>
      <div className="flex-1 p-4 bg-black/95 overflow-y-auto terminal-scroll font-brand text-xs leading-relaxed text-zinc-300">
        <div className="mb-2 text-zinc-600">
          <span className="text-zinc-700">[12:00:01]</span> Daemon: Listening for on-chain events on Arc Testnet...
        </div>
        
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {decisions.map((dec) => {
               const styles = getLogStyle(dec);
               const isCopied = copiedId === dec.id;
               return (
                 <motion.div 
                   key={dec.id} 
                   className="pb-3 border-b border-zinc-900 last:border-0"
                   initial={{ opacity: 0, y: -10, height: 0 }}
                   animate={{ opacity: 1, y: 0, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   transition={{ duration: 0.3 }}
                 >
                   <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-1.5">
                     <span>[{new Date(dec.created_at).toLocaleTimeString()}]</span>
                     <div className="flex items-center gap-2">
                       <span className="px-1.5 py-0.2 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-[4px] text-[10px] font-bold tracking-widest uppercase">
                         🤖 Agent Sig
                       </span>
                       <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${styles.badgeBg}`}>
                         {dec.trigger_type}
                       </span>
                     </div>
                   </div>
                   <p className="text-zinc-200 text-xs">
                     <span className={styles.textStyle}>{styles.prefix}</span> {dec.reasoning}
                   </p>
                   {dec.tx_hash && (
                     <div className="mt-2 flex items-center gap-2 bg-zinc-950 border border-zinc-900 rounded px-2.5 py-1 inline-flex max-w-full">
                       <span className="text-zinc-500 text-[10px] font-bold">PROOF:</span>
                       <a 
                         href={`https://testnet.arcscan.app/tx/${dec.tx_hash}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-zinc-300 hover:text-white underline font-brand text-[11px] truncate max-w-[160px] md:max-w-[220px]"
                       >
                         {dec.tx_hash.substring(0, 10)}...{dec.tx_hash.slice(-8)}
                       </a>
                       <button 
                         onClick={() => handleCopyHash(dec.tx_hash, dec.id)}
                         className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center"
                         title="Copy Tx Hash"
                       >
                         <span className="material-symbols-outlined text-xs md:text-sm">{isCopied ? 'done' : 'content_copy'}</span>
                       </button>
                       <a 
                         href={`https://testnet.arcscan.app/tx/${dec.tx_hash}`}
                         target="_blank"
                         rel="noreferrer"
                         className="text-zinc-500 hover:text-zinc-300 flex items-center"
                       >
                         <span className="material-symbols-outlined text-xs md:text-sm">open_in_new</span>
                       </a>
                     </div>
                   )}
                 </motion.div>
               );
            })}
          </AnimatePresence>
        </div>

        {decisions.length === 0 && (
          <div className="text-zinc-700 animate-pulse mt-4">&gt; Awaiting agent transactions... _</div>
        )}

        <div className="text-zinc-600 animate-pulse mt-3">&gt; Connection open, listening for check-ins... _</div>
      </div>
    </div>
  );
}
