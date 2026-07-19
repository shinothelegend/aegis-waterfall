import type { AgentDecision } from '../hooks/useCheckpointData';

interface LiveLogsProps {
  decisions: AgentDecision[];
}

export function LiveLogs({ decisions }: LiveLogsProps) {
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
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      textStyle: 'text-emerald-300',
      prefix: '🤖 [Auto Refund]'
    };
  };

  return (
    <div className="glass-panel rounded-xl border border-white/10 flex flex-col h-[350px]">
      <div className="bg-[#0e0e12] border-b border-white/10 p-3 flex justify-between items-center rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-sm">terminal</span>
          <span className="font-mono text-xs text-slate-300 font-bold">Autonomous Agent activity Feed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="font-mono text-[9px] text-slate-500 uppercase">Realtime Feed</span>
        </div>
      </div>
      <div className="flex-1 p-4 bg-[#050505] rounded-b-xl overflow-y-auto terminal-scroll font-mono text-xs leading-relaxed text-slate-300">
        <div className="mb-2 text-slate-600">
          <span className="text-slate-500">[12:00:01]</span> Daemon: Listening for on-chain events on Arc Testnet...
        </div>
        
        {decisions.length === 0 ? (
          <div className="text-slate-600 animate-pulse mt-4">&gt; Awaiting agent transactions... _</div>
        ) : (
          decisions.map((dec) => {
            const styles = getLogStyle(dec);
            return (
              <div key={dec.id} className="mb-4 pb-3 border-b border-white/5 last:border-0">
                <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                  <span>[{new Date(dec.created_at).toLocaleTimeString()}]</span>
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${styles.badgeBg}`}>
                    {dec.trigger_type}
                  </span>
                </div>
                <p className="text-slate-200">
                  <span className={styles.textStyle}>{styles.prefix}</span> {dec.reasoning}
                </p>
                {dec.tx_hash && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-slate-600 text-[10px]">&gt; Tx Proof:</span>
                    <a 
                      href={`https://testnet.arcscan.app/tx/${dec.tx_hash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline font-mono text-[10px] truncate max-w-[250px]"
                    >
                      {dec.tx_hash}
                    </a>
                    <span className="material-symbols-outlined text-[11px] text-cyan-500">open_in_new</span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div className="text-cyan-500/50 animate-pulse mt-2">&gt; Connection open, listening for check-ins... _</div>
      </div>
    </div>
  );
}
