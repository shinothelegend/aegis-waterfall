import { useEffect } from 'react';

interface WaterfallTransitionProps {
  phase: 'idle' | 'cascading' | 'fadeout';
  onHalfway: () => void;
  onComplete: () => void;
}

export function WaterfallTransition({ phase, onHalfway, onComplete }: WaterfallTransitionProps) {
  useEffect(() => {
    if (phase === 'cascading') {
      const timer = setTimeout(() => {
        onHalfway();
      }, 2500);
      return () => clearTimeout(timer);
    }
    if (phase === 'fadeout') {
      const timer = setTimeout(() => {
        onComplete();
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [phase, onHalfway, onComplete]);

  if (phase === 'idle') return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden ${
        phase === 'fadeout' ? 'animate-backdrop-fadeout' : ''
      }`}
      style={{ backfaceVisibility: 'hidden' }}
    >
      {/* Grid pattern background with subtle ambient center glow */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_50%)] pointer-events-none mix-blend-screen" />
      
      <div className="relative z-10 flex flex-col items-center gap-12">
        
        {/* Core Frame Wrapper */}
        <div className="w-56 h-56 relative flex items-center justify-center">
          
          {/* Ambient center glow */}
          {phase === 'cascading' && (
            <div className="absolute inset-4 bg-white/5 blur-xl rounded-full mix-blend-screen pointer-events-none" />
          )}

          {/* Layer 1: Dashed outer orbit ring (spins counter-clockwise) */}
          {phase === 'cascading' && (
            <div 
              className="absolute inset-0 rounded-full border border-dashed border-zinc-600/30 border-t-zinc-300/80 animate-spin-reverse will-change-transform shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"
              style={{ animationDuration: '10s' }}
            />
          )}

          {/* Layer 2: Static solid outer ring indicator with glowing node */}
          {phase === 'cascading' && (
            <div className="absolute -inset-5 rounded-full border border-zinc-800/60 pointer-events-none flex items-start justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full mt-[-3px] shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
            </div>
          )}

          {/* Layer 3: Central Yin-Yang Wheel (spins clockwise, bursts on exit) */}
          <div 
            className={`w-[1000px] h-[1000px] absolute flex items-center justify-center rounded-full will-change-transform ${
              phase === 'cascading' 
                ? 'animate-yinyang-spin' 
                : 'animate-yinyang-burst'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              transformStyle: 'preserve-3d'
            }}
          >
            <svg viewBox="0 0 200 200" className="w-[750px] h-[750px]" shapeRendering="geometricPrecision">
              <circle cx="100" cy="100" r="100" fill="#ffffff" stroke="#ffffff" strokeWidth="1" />
              <path 
                d="M 100 0 A 100 100 0 0 1 100 200 A 50 50 0 0 1 100 100 A 50 50 0 0 0 100 0" 
                fill="#000000" 
                stroke="#000000" 
                strokeWidth="1.5" 
              />
              <circle cx="100" cy="50" r="15" fill="#ffffff" />
              <circle cx="100" cy="150" r="15" fill="#000000" />
              <circle cx="100" cy="100" r="100" fill="none" stroke="#000000" strokeWidth="1.5" />
            </svg>
          </div>

        </div>

        {/* Premium Typography Details */}
        {phase === 'cascading' && (
          <div className="text-center space-y-3 font-brand pointer-events-none select-none">
            <h3 className="text-[13px] font-bold tracking-[0.5em] text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 via-white to-zinc-500 uppercase animate-pulse">
              AEGIS ESCROW ENGINE
            </h3>
            <div className="flex items-center justify-center gap-3">
              <div className="w-1 h-1 rounded-full bg-zinc-400 animate-ping" />
              <p className="text-[10px] text-zinc-500 tracking-[0.3em] font-medium uppercase">
                Streaming Value Channels
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
