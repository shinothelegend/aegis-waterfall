import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WaterfallTransitionProps {
  phase: 'idle' | 'cascading' | 'fadeout';
  onHalfway: () => void;
  onComplete: () => void;
}

interface Particle {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
  color: string;
  type: 'stream' | 'coin' | 'text' | 'hash';
  value?: string;
  angle?: number;
  spinSpeed?: number;
  scale?: number;
}

export function WaterfallTransition({ phase, onHalfway, onComplete }: WaterfallTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);

  // Keep phase ref updated to avoid closure issues in canvas loop
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Transition stages
    let progress = 0; // 0 to 1
    const transitionDuration = 1600; // ms to reach halfway (fully covered)
    const startTime = Date.now();
    let triggeredHalfway = false;

    // Particle generator options
    const particles: Particle[] = [];
    const maxParticles = 180;

    const colors = {
      cyan: 'rgba(6, 182, 212, ', // cyan-500
      amber: 'rgba(245, 158, 11, ', // amber-500
      blue: 'rgba(59, 130, 246, ', // blue-500
      white: 'rgba(255, 255, 255, ',
    };

    const techWords = [
      'USDC_SETTLED',
      'ESCROW_LOCKED',
      'ESCROW_RELEASED',
      'SBT_MINTED',
      'ATTESTATION_ISSUED',
      'AUTONOMOUS_PAYOUT',
      'CIRCLES_DCW_API',
      'ARC_TESTNET_TX',
      'ZERO_HUMAN_CLICKS',
      'LLM_INVOICE_OK',
    ];

    const generateParticle = (forceYZero = false): Particle => {
      const typeRand = Math.random();
      let type: Particle['type'] = 'stream';
      let value = '';
      let scale = 1;

      if (typeRand > 0.85) {
        type = 'coin';
      } else if (typeRand > 0.7) {
        type = 'text';
        value = techWords[Math.floor(Math.random() * techWords.length)];
      } else if (typeRand > 0.6) {
        type = 'hash';
        value = `0x${Math.random().toString(16).substr(2, 6)}...${Math.random().toString(16).substr(2, 4)}`;
      }

      // Distribute starting position
      const x = Math.random() * window.innerWidth;
      const y = forceYZero ? -50 : (Math.random() * window.innerHeight * 0.8) - 100;
      const speed = Math.random() * 8 + 6; // Fast descent
      const length = Math.random() * 80 + 40;
      const opacity = Math.random() * 0.6 + 0.3;

      // Select colors based on type
      let color = colors.cyan;
      if (type === 'coin') {
        color = Math.random() > 0.3 ? colors.cyan : colors.amber;
        scale = Math.random() * 0.5 + 0.6;
      } else if (type === 'text') {
        color = colors.white;
      } else if (type === 'hash') {
        color = colors.blue;
      }

      return {
        x,
        y,
        speed,
        length,
        opacity,
        color,
        type,
        value,
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.05,
        scale,
      };
    };

    // Pre-populate particles
    for (let i = 0; i < maxParticles / 2; i++) {
      particles.push(generateParticle(false));
    }

    // Canvas animation loop
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (phaseRef.current === 'cascading') {
        progress = Math.min(elapsed / transitionDuration, 1);
        if (progress >= 1 && !triggeredHalfway) {
          triggeredHalfway = true;
          onHalfway();
        }
      }

      // Draw dark background with trail effect
      // Use lower alpha to create motion blur waterfall trails
      ctx.fillStyle = `rgba(3, 7, 18, ${phaseRef.current === 'fadeout' ? 0.3 : 0.18})`;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // Add glow filter
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';

      // Draw & Update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Apply acceleration (waterfall physics)
        p.speed += 0.15;
        p.y += p.speed;
        
        if (p.type === 'coin' && p.angle !== undefined && p.spinSpeed !== undefined) {
          p.angle += p.spinSpeed;
        }

        // Adjust particle opacity based on phase and progression
        let currentOpacity = p.opacity;
        if (phaseRef.current === 'fadeout') {
          currentOpacity *= 0.4; // Fade them out
        } else {
          // Make transition denser towards the halfway point
          currentOpacity *= (0.5 + progress * 0.5);
        }

        // Draw particle based on its type
        if (p.type === 'stream') {
          // Falling neon streams
          const grad = ctx.createLinearGradient(p.x, p.y - p.length, p.x, p.y);
          grad.addColorStop(0, `${p.color}0)`);
          grad.addColorStop(0.5, `${p.color}${currentOpacity * 0.5})`);
          grad.addColorStop(1, `${p.color}${currentOpacity})`);

          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.random() * 2 + 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - p.length);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        } 
        else if (p.type === 'coin') {
          // Draw a glowing USDC coin
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.angle !== undefined) ctx.rotate(p.angle);
          ctx.scale(p.scale || 1, p.scale || 1);

          // Coin outer circle
          ctx.strokeStyle = `${p.color}${currentOpacity})`;
          ctx.lineWidth = 2;
          ctx.fillStyle = `rgba(5, 8, 20, ${currentOpacity * 0.9})`;
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Inner ring
          ctx.strokeStyle = `${p.color}${currentOpacity * 0.4})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.stroke();

          // S/$ symbol
          ctx.fillStyle = `${p.color}${currentOpacity * 1.2})`;
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0);

          ctx.restore();
        } 
        else if (p.type === 'text' && p.value) {
          // Floating fintech status words
          ctx.save();
          ctx.font = '9px "Space Grotesk", "Space Mono", monospace';
          ctx.fillStyle = `${p.color}${currentOpacity * 0.9})`;
          ctx.textAlign = 'center';
          
          // Draw outline glow
          ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
          ctx.shadowBlur = 4;
          
          ctx.fillText(p.value, p.x, p.y);
          ctx.restore();
        } 
        else if (p.type === 'hash' && p.value) {
          // Small hex transactions
          ctx.save();
          ctx.font = '8px monospace';
          ctx.fillStyle = `${p.color}${currentOpacity * 0.6})`;
          ctx.fillText(p.value, p.x, p.y);
          ctx.restore();
        }

        // Reset particle if it leaves the screen
        if (p.y > window.innerHeight + 100) {
          // If in fadeout phase, don't spawn new ones, just filter out
          if (phaseRef.current === 'fadeout') {
            particles.splice(i, 1);
            i--;
          } else {
            particles[i] = generateParticle(true);
          }
        }
      }

      // Add a dense stream of particles if we are in cascading phase and not fully covered yet
      if (phaseRef.current === 'cascading' && particles.length < maxParticles) {
        // Spawn more over time to create a cascading crescendo
        const spawnCount = Math.floor(progress * 4) + 1;
        for (let k = 0; k < spawnCount; k++) {
          particles.push(generateParticle(true));
        }
      }

      // Complete the transition if we are in fadeout and all particles are gone (or timeout)
      if (phaseRef.current === 'fadeout' && (particles.length === 0 || elapsed > 3000)) {
        onComplete();
        return;
      }

      // Clear shadow properties for next draw
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [onHalfway, onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-[#030712] flex items-center justify-center overflow-hidden"
        >
          {/* Canvas for the particles */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />

          {/* Glowing central vignette for professional overlay feel */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712] opacity-80 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

          {/* Central status card telling the agent visual story */}
          <div className="relative z-10 text-center max-w-md px-6 pointer-events-none select-none">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
              className="flex flex-col items-center gap-6"
            >
              {/* Waterfall Shield Indicator */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center animate-pulse glow-cyan-sm">
                  <span className="material-symbols-outlined text-cyan-400 text-3xl animate-bounce">
                    waterfall_chart
                  </span>
                </div>
                {/* Dynamic circular orbit rings */}
                <div className="absolute inset-[-8px] border border-cyan-500/20 rounded-full animate-[spin_6s_linear_infinite]" />
                <div className="absolute inset-[-16px] border border-cyan-500/10 rounded-full animate-[spin_12s_linear_infinite_reverse] border-dashed" />
              </div>

              {/* Text Messaging */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold tracking-[0.25em] text-white uppercase font-display">
                  Aegis Escrow Engine
                </h3>
                <p className="text-[11px] text-cyan-400 font-mono tracking-wider animate-pulse">
                  {phase === 'cascading' 
                    ? 'STREAMING VALUE ESCROWS...' 
                    : 'AEGIS AGENT SYNCHRONIZED ✓'}
                </p>
              </div>

              {/* Progress bar mimicking network handshake */}
              <div className="w-48 h-[2px] bg-cyan-950 border border-cyan-900 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ left: '-100%' }}
                  animate={{ left: phase === 'cascading' ? '0%' : '100%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  className="absolute top-0 bottom-0 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                />
              </div>

              <div className="text-[9px] text-slate-500 font-mono tracking-widest max-w-[280px]">
                {phase === 'cascading' 
                  ? 'VERIFYING STABLECOIN DEPOSIT CHANNELS...'
                  : 'LOADING MISSION CONTROL INTERFACE...'}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
