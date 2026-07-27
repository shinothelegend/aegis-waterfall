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
        badgeBg: 'bg-red-500/10 text-red-400 border-red-500/20',
        textStyle: 'text-red-300',
        prefix: '🛑 [Blocked/Flagged]'
      };
    }
    if (dec.trigger_type === 'settle') {
      return {
        badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        textStyle: 'text-purple-300',
        prefix: '🏦 [Settle Payout]'
      };
    }
    if (dec.trigger_type === 'invoice_approval') {
      return {
        badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        textStyle: 'text-amber-300',
        prefix: '📄 [Invoice Audit]'
      };
    }
    return {
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      textStyle: 'text-cyan-300',
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
    <div className="glass-panel rounded-xl border border-white/5 flex flex-col h-[350px] overflow-hidden">
      <div className="bg-[#080b16] border-b border-white/5 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-sm">terminal</span>
          <span className="font-mono text-[11px] text-slate-300 font-bold uppercase tracking-wider">Autonomous Agent logs</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 status-dot-active"></div>
          <span className="font-mono text-[9px] text-slate-400 uppercase font-bold">Live Link</span>
        </div>
      </div>
      <div className="flex-1 p-4 bg-[#03050a]/95 overflow-y-auto terminal-scroll font-mono text-xs leading-relaxed text-slate-300">
        <div className="mb-2 text-slate-600">
          <span className="text-slate-500">[12:00:01]</span> Daemon: Listening for on-chain events on Arc Testnet...
        </div>
        
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {decisions.map((dec) => {
              const styles = getLogStyle(dec);
              const isCopied = copiedId === dec.id;
              return (
                <motion.div 
                  key={dec.id} 
                  className="pb-3 border-b border-white/5 last:border-0"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-center text-[9px] text-slate-500 mb-1.5">
                    <span>[{new Date(dec.created_at).toLocaleTimeString()}]</span>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 bg-cyan-950/20 text-cyan-400 border border-cyan-500/20 rounded-[4px] text-[8px] font-bold tracking-widest uppercase">
                        🤖 Agent Sig
                      </span>
                      <span className={`px-2 py-0.5 rounded border text-[8px] font-bold uppercase tracking-wider ${styles.badgeBg}`}>
                        {dec.trigger_type}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-200 text-[11px]">
                    <span className={styles.textStyle}>{styles.prefix}</span> {dec.reasoning}
                  </p>
                  {dec.tx_hash && (
                    <div className="mt-2 flex items-center gap-1.5 bg-[#070b14] border border-white/5 rounded px-2 py-1 inline-flex max-w-full">
                      <span className="text-slate-500 text-[9px] font-bold">PROOF:</span>
                      <a 
                        href={`https://testnet.arcscan.app/tx/${dec.tx_hash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 font-mono text-[9px] truncate max-w-[150px] md:max-w-[200px]"
                      >
                        {dec.tx_hash.substring(0, 10)}...{dec.tx_hash.slice(-8)}
                      </a>
                      <button 
                        onClick={() => handleCopyHash(dec.tx_hash, dec.id)}
                        className="text-slate-500 hover:text-slate-300 transition-colors flex items-center"
                        title="Copy Tx Hash"
                      >
                        <span className="material-symbols-outlined text-[11px]">{isCopied ? 'done' : 'content_copy'}</span>
                      </button>
                      <a 
                        href={`https://testnet.arcscan.app/tx/${dec.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-slate-300 flex items-center"
                      >
                        <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                      </a>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {decisions.length === 0 && (
          <div className="text-slate-600 animate-pulse mt-4">&gt; Awaiting agent transactions... _</div>
        )}

        <div className="text-cyan-500/50 animate-pulse mt-3">&gt; Connection open, listening for check-ins... _</div>
      </div>
    </div>
  );
}
