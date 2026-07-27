import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface LLMInvoiceReviewProps {
  feedback: string;
  status: string;
  amount: number;
  vendorAddress: string;
}

export function LLMInvoiceReview({ feedback, status, amount, vendorAddress }: LLMInvoiceReviewProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [stage, setStage] = useState<'analyzing' | 'typing' | 'done'>('analyzing');
  const indexRef = useRef(0);
  const words = feedback ? feedback.split(' ') : [];

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setDisplayedText(feedback);
      setStage('done');
      return;
    }

    setDisplayedText('');
    setStage('analyzing');
    indexRef.current = 0;

    // Phase 1: Analyzing step simulator
    const analyzeTimer = setTimeout(() => {
      setStage('typing');
    }, 1200);

    return () => clearTimeout(analyzeTimer);
  }, [feedback]);

  useEffect(() => {
    if (stage !== 'typing' || words.length === 0) return;

    // Phase 2: Typewriter word streaming
    const interval = setInterval(() => {
      if (indexRef.current < words.length) {
        setDisplayedText((prev) => 
          prev === '' ? words[indexRef.current] : prev + ' ' + words[indexRef.current]
        );
        indexRef.current += 1;
      } else {
        setStage('done');
        clearInterval(interval);
      }
    }, 35); // Fast, snappy word-by-word streaming

    return () => clearInterval(interval);
  }, [stage, feedback]);

  const handleSkip = () => {
    setDisplayedText(feedback);
    setStage('done');
  };

  const isApproved = status === 'approved' || status === 'paid';
  const isRejected = status === 'rejected';

  return (
    <div className="font-mono text-xs border border-white/10 rounded-lg bg-[#04060d] overflow-hidden">
      {/* Terminal Header */}
      <div className="bg-[#090e1a] border-b border-white/5 px-3 py-1.5 flex justify-between items-center text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          AGENT INSTANCE: INVOICE_AUDIT_DAEMON
        </span>
        {stage !== 'done' && (
          <button 
            onClick={handleSkip}
            className="text-cyan-400 hover:underline hover:text-cyan-300 font-bold active:scale-95 transition-all"
          >
            Skip Audit Anim
          </button>
        )}
      </div>

      {/* Terminal Screen */}
      <div className="p-4 space-y-3">
        {/* Step details */}
        <div className="space-y-1 text-slate-400 text-[10px]">
          <p className="text-slate-500 flex justify-between">
            <span>&gt; Vendor Address:</span> 
            <span className="text-slate-300">{vendorAddress.substring(0, 12)}...{vendorAddress.slice(-4)}</span>
          </p>
          <p className="text-slate-500 flex justify-between">
            <span>&gt; Claim Amount:</span> 
            <span className="text-cyan-400 font-bold font-display">{amount.toFixed(2)} USDC</span>
          </p>
        </div>

        {/* Streaming area */}
        <div className="border-t border-white/5 pt-3 text-[11px] leading-relaxed text-slate-300 min-h-[50px] relative">
          {stage === 'analyzing' && (
            <div className="flex flex-col gap-1 text-cyan-400/80 animate-pulse">
              <p>&gt; Initializing audit rubric review...</p>
              <p>&gt; Compiling vector text alignments... _</p>
            </div>
          )}

          {stage !== 'analyzing' && (
            <div>
              <span className="text-purple-400 font-bold mr-1">&gt; LLM_REASONING:</span>
              <span>{displayedText}</span>
              {stage === 'typing' && (
                <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-1 animate-pulse align-middle" />
              )}
            </div>
          )}
        </div>

        {/* Result transition */}
        {stage === 'done' && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/5 pt-3 flex items-center justify-between"
          >
            <span className="text-slate-500 text-[10px]">&gt; Audit Result Emitted:</span>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]' :
                isRejected ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]' :
                'bg-white/5 text-slate-400 border border-white/10'
              }`}>
                {status.toUpperCase()}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
