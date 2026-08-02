import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BadgeItem } from '../hooks/useCheckpointData';
import toast from 'react-hot-toast';

interface SBTRevealModalProps {
  badge: BadgeItem | null;
  isOpen: boolean;
  onClose: () => void;
  refundTxHash?: string;
}

export function SBTRevealModal({ badge, isOpen, onClose, refundTxHash }: SBTRevealModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsFlipped(false);
      const timer = setTimeout(() => {
        setIsFlipped(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, badge]);

  if (!badge) return null;

  const handleCopyTx = () => {
    if (refundTxHash) {
      navigator.clipboard.writeText(refundTxHash);
      setCopied(true);
      toast.success("Refund transaction hash copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="max-w-2xl w-full flex flex-col md:flex-row gap-6 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl font-brand">
            
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Left side: 3D Flip Card Container */}
            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <div 
                className="w-56 h-72 cursor-pointer"
                style={{ perspective: "1000px" }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <motion.div 
                  className="w-full h-full relative"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                  {/* Card Back (Shows up before reveal) */}
                  <div 
                    className="absolute inset-0 w-full h-full rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col items-center justify-between shadow-lg"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="w-full border-b border-zinc-800 pb-2 flex justify-between items-center text-[10px] text-white font-brand">
                      <span>AEGIS SECURITY</span>
                      <span>SECURE BADGE</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center animate-pulse">
                        <span className="material-symbols-outlined text-white text-3xl">shield</span>
                      </div>
                      <h4 className="font-brand text-xs font-bold text-white uppercase tracking-widest">Attestation Minting</h4>
                      <p className="text-[9px] text-zinc-500 leading-normal max-w-[150px] font-brand">ON-CHAIN SOULBOUND NFT GENERATOR ACTIVE</p>
                    </div>
                    <div className="w-full text-center text-[9px] text-zinc-500 font-brand font-bold uppercase tracking-wider">
                      TAP TO REVEAL ART
                    </div>
                  </div>

                  {/* Card Front (Shows NFT SVG) */}
                  <div 
                    className="absolute inset-0 w-full h-full rounded-xl bg-zinc-900 border border-zinc-800 p-3 flex flex-col items-center justify-between shadow-lg"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <div className="w-full border-b border-zinc-800 pb-1 flex justify-between items-center text-[9px] text-zinc-400 font-brand">
                      <span className="text-white font-bold">ATTESTATION SBT</span>
                      <span>#{badge.tokenId}</span>
                    </div>

                    <div className="flex-1 w-full flex items-center justify-center p-2">
                      <div 
                        className="w-full h-40 flex items-center justify-center overflow-hidden rounded bg-zinc-950 border border-zinc-800"
                        dangerouslySetInnerHTML={{ __html: badge.svg }}
                      />
                    </div>

                    <div className="w-full text-center mt-2">
                      <h4 className="font-brand text-xs font-black text-white truncate">{badge.name}</h4>
                      <p className="font-brand text-[9px] text-zinc-400 mt-0.5 uppercase tracking-wide">Verified Checked-In</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right side: Metadata details */}
            <div className="flex-1 flex flex-col justify-between font-brand">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded bg-zinc-900 text-white border border-zinc-800 text-[9px] font-bold uppercase tracking-wider font-brand">
                  Autonomous Mint Event
                </div>
                <h3 className="font-display text-xl font-bold text-white mt-2 leading-tight">Check-In Attestation NFT</h3>
                <p className="text-[11px] text-zinc-400 mt-2 font-body leading-relaxed">
                  {badge.description || "This soulbound NFT acts as cryptographically signed proof of attendance and eligibility for the USDC ticket refund."}
                </p>

                {/* Attributes list */}
                <div className="mt-4 space-y-2">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-brand block">Attributes & Audit Log</span>
                  <div className="grid grid-cols-2 gap-2 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 font-brand text-[10px]">
                    {badge.attributes.map((attr, idx) => (
                      <div key={idx} className="flex flex-col">
                        <span className="text-zinc-500 text-[8px] uppercase">{attr.trait_type}</span>
                        <span className="text-white truncate font-bold">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transaction Proof */}
              {refundTxHash && (
                <div className="mt-6 pt-4 border-t border-zinc-900">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-brand block">Autonomous Refund Proof</span>
                  <div className="mt-1.5 flex gap-2 bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 items-center justify-between font-brand text-[10px]">
                    <div className="min-w-0">
                      <span className="text-white font-bold uppercase text-[8px]">Arc Testnet Tx Hash</span>
                      <p className="text-zinc-400 truncate w-32 md:w-44 mt-0.5">{refundTxHash}</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={handleCopyTx}
                        className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 p-1.5 rounded text-white transition-colors active:scale-95 flex items-center justify-center"
                        title="Copy Tx Hash"
                      >
                        <span className="material-symbols-outlined text-[12px]">{copied ? 'done' : 'content_copy'}</span>
                      </button>
                      <a 
                        href={`https://testnet.arcscan.app/tx/${refundTxHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 p-1.5 rounded text-white transition-colors flex items-center justify-center"
                        title="View on ArcScan"
                      >
                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
