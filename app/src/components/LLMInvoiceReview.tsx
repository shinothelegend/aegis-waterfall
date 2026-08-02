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
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setDisplayedText(feedback);
      setStage('done');
      return;
    }

    setDisplayedText('');
    setStage('analyzing');
    indexRef.current = 0;

    const analyzeTimer = setTimeout(() => {
      setStage('typing');
    }, 1200);

    return () => clearTimeout(analyzeTimer);
  }, [feedback]);

  useEffect(() => {
    if (stage !== 'typing' || words.length === 0) return;

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
    }, 35);

    return () => clearInterval(interval);
  }, [stage, feedback]);

  const handleSkip = () => {
    setDisplayedText(feedback);
    setStage('done');
  };

  const isApproved = status === 'approved' || status === 'paid';
  const isRejected = status === 'rejected';

  return (
    <div className="font-brand text-xs border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden">
      {/* Terminal Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-1.5 flex justify-between items-center text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          AGENT INSTANCE: INVOICE_AUDIT_DAEMON
        </span>
        {stage !== 'done' && (
          <button 
            onClick={handleSkip}
            className="text-zinc-400 hover:text-white font-bold active:scale-95 transition-all"
          >
            Skip Audit Anim
          </button>
        )}
      </div>

      {/* Terminal Screen */}
      <div className="p-4 space-y-3">
        {/* Step details */}
        <div className="space-y-1 text-zinc-400 text-[10px]">
          <p className="text-zinc-500 flex justify-between">
            <span>&gt; Vendor Address:</span> 
            <span className="text-zinc-300 font-brand">{vendorAddress.substring(0, 12)}...{vendorAddress.slice(-4)}</span>
          </p>
          <p className="text-zinc-500 flex justify-between">
            <span>&gt; Claim Amount:</span> 
            <span className="text-white font-bold font-brand">{amount.toFixed(2)} USDC</span>
          </p>
        </div>

        {/* Streaming area */}
        <div className="border-t border-zinc-900 pt-3 text-[11px] leading-relaxed text-zinc-300 min-h-[50px] relative">
          {stage === 'analyzing' && (
            <div className="flex flex-col gap-1 text-zinc-500 animate-pulse">
              <p>&gt; Initializing audit rubric review...</p>
              <p>&gt; Compiling vector text alignments... _</p>
            </div>
          )}

          {stage !== 'analyzing' && (
            <div>
              <span className="text-zinc-400 font-bold mr-1">&gt; LLM_REASONING:</span>
              <span>{displayedText}</span>
              {stage === 'typing' && (
                <span className="inline-block w-1.5 h-3.5 bg-white ml-1 animate-pulse align-middle" />
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
            className="border-t border-zinc-900 pt-3 flex items-center justify-between"
          >
            <span className="text-zinc-500 text-[10px]">&gt; Audit Result Emitted:</span>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isApproved ? 'bg-white text-black border border-white' :
                isRejected ? 'bg-zinc-900 text-zinc-500 border border-zinc-800' :
                'bg-zinc-900 text-zinc-400 border border-zinc-800'
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
