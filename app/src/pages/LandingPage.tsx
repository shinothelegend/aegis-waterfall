import { useState, useEffect, useRef } from 'react';
import { Shield, Zap, Sparkles, RefreshCw, Layers, ArrowRight, CheckCircle2, ChevronRight, Cpu } from 'lucide-react';

interface LandingPageProps {
  onLaunchApp: () => void;
  isConnected: boolean;
}

export function LandingPage({ onLaunchApp, isConnected }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'deposit' | 'settle'>('create');
  const [flowSpeed, setFlowSpeed] = useState<'normal' | 'fast' | 'slow'>('normal');
  const [frogClicked, setFrogClicked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Ref for scroll animation triggers
  const heroRef = useRef<HTMLDivElement>(null);
  const waterfallRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [waterfallVisible, setWaterfallVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Intersection Observer for fade-in animations
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setHeroVisible(true);
        }
      });
    }, observerOptions);

    const waterfallObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setWaterfallVisible(true);
        }
      });
    }, observerOptions);

    if (heroRef.current) heroObserver.observe(heroRef.current);
    if (waterfallRef.current) waterfallObserver.observe(waterfallRef.current);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      heroObserver.disconnect();
      waterfallObserver.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden selection:bg-cyan-200 selection:text-cyan-900">
      {/* Dynamic Landing CSS Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600;700&display=swap');
        
        .font-serif-fancy {
          font-family: 'Instrument Serif', Georgia, serif;
        }
        
        .font-brand-mono {
          font-family: 'JetBrains Mono', monospace;
        }

        .font-outfit {
          font-family: 'Outfit', sans-serif;
        }

        /* Subtle dot-grid pattern */
        .bg-dot-grid {
          background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px);
          background-size: 24px 24px;
        }

        /* Continuous waterfall stream animation */
        @keyframes waterfall-flow {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -80;
          }
        }

        .water-stream {
          stroke-dasharray: 40, 20;
          animation: waterfall-flow ${flowSpeed === 'fast' ? '0.7s' : flowSpeed === 'slow' ? '3s' : '1.5s'} linear infinite;
        }

        .water-stream-fast {
          stroke-dasharray: 30, 15;
          animation: waterfall-flow ${flowSpeed === 'fast' ? '0.4s' : flowSpeed === 'slow' ? '1.8s' : '0.8s'} linear infinite;
        }

        .water-stream-slow {
          stroke-dasharray: 50, 25;
          animation: waterfall-flow ${flowSpeed === 'fast' ? '1.1s' : flowSpeed === 'slow' ? '4.5s' : '2.2s'} linear infinite;
        }

        /* Glowing mist animation */
        @keyframes mist-float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-8px) scale(1.15);
            opacity: 0.6;
          }
        }

        .mist-bubble {
          animation: mist-float 3s ease-in-out infinite;
        }

        /* Floating fireflies */
        @keyframes firefly-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(40px, -50px) scale(1.3); opacity: 0.8; }
        }
        @keyframes firefly-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1.2); opacity: 0.6; }
          50% { transform: translate(-50px, -30px) scale(0.8); opacity: 0.2; }
        }
        @keyframes firefly-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(0.9); opacity: 0.4; }
          50% { transform: translate(30px, -20px) scale(1.4); opacity: 0.9; }
        }

        .firefly-1 { animation: firefly-drift-1 8s ease-in-out infinite; }
        .firefly-2 { animation: firefly-drift-2 11s ease-in-out infinite; }
        .firefly-3 { animation: firefly-drift-3 9s ease-in-out infinite; }

        /* Splash foam pulsing */
        @keyframes splash-pulse {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.03) translateY(-2px); }
        }
        .splash-foam {
          transform-origin: center bottom;
          animation: splash-pulse 2s ease-in-out infinite;
        }

        /* Ripple effect in pool */
        @keyframes pool-ripple {
          0% { transform: scale(0.95); opacity: 0.3; }
          50% { transform: scale(1.05); opacity: 0.6; }
          100% { transform: scale(0.95); opacity: 0.3; }
        }
        .pool-ripple-path {
          transform-origin: 500px 600px;
          animation: pool-ripple 4s ease-in-out infinite;
        }

        /* Gradient logo text */
        .text-gradient {
          background: linear-gradient(135deg, #22d3ee 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Transition utility */
        .transition-all-custom {
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* NAVBAR */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm py-4' 
          : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          {/* Left: Logo & Wordmark */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onLaunchApp}>
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center shadow-md shadow-cyan-500/10 group-hover:scale-105 transition-transform duration-300">
              <span className="material-symbols-outlined text-white text-[18px] font-bold">waterfall_chart</span>
            </div>
            <span className="font-brand-mono text-sm font-bold tracking-tight text-slate-800 flex items-center gap-1.5">
              AEGIS <span className="text-gradient">WATERFALL</span>
            </span>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 font-outfit text-sm font-medium text-slate-600">
            <a href="#product" className="hover:text-cyan-600 transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-cyan-600 transition-colors">How it works</a>
            <a href="#docs" className="hover:text-cyan-600 transition-colors">Docs</a>
            <a href="#community" className="hover:text-cyan-600 transition-colors">Community</a>
          </nav>

          {/* Right Button & Mobile Toggle */}
          <div className="flex items-center gap-4">
            {isConnected ? (
              <button 
                onClick={onLaunchApp}
                className="font-brand-mono text-xs font-semibold px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-600 text-white hover:opacity-90 active:scale-95 shadow-md shadow-cyan-500/15 transition-all"
              >
                Go to Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={onLaunchApp}
                  className="hidden sm:inline-block font-outfit text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors"
                >
                  Sign In
                </button>
                <button 
                  onClick={onLaunchApp}
                  className="font-brand-mono text-xs font-semibold px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-600 text-white hover:brightness-105 active:scale-95 shadow-md shadow-cyan-500/15 transition-all"
                >
                  Connect Wallet
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-700 hover:text-slate-900 p-2 focus:outline-none"
              aria-label="Toggle Menu"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg border-b border-slate-200 px-6 py-6 flex flex-col gap-4 font-outfit text-base text-slate-800 shadow-xl animate-fadeIn">
            <a href="#product" onClick={() => setMobileMenuOpen(false)} className="hover:text-cyan-600 py-1">Product</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-cyan-600 py-1">How it works</a>
            <a href="#docs" onClick={() => setMobileMenuOpen(false)} className="hover:text-cyan-600 py-1">Docs</a>
            <a href="#community" onClick={() => setMobileMenuOpen(false)} className="hover:text-cyan-600 py-1">Community</a>
            <hr className="border-slate-100 my-1" />
            <button 
              onClick={() => { setMobileMenuOpen(false); onLaunchApp(); }}
              className="font-brand-mono text-xs font-semibold w-full py-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-600 text-white text-center shadow-md shadow-cyan-500/15"
            >
              Launch Dashboard
            </button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section 
        ref={heroRef}
        className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-16 px-6 md:px-12 bg-dot-grid"
      >
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Badge */}
          <div className={`mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/50 shadow-sm transition-all-custom duration-1000 ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
            <span className="font-brand-mono text-[10px] text-cyan-700 font-semibold tracking-wider uppercase">
              Autonomous Escrow Protocol
            </span>
          </div>

          {/* Heading */}
          <h1 className={`font-serif-fancy text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-slate-950 font-normal leading-[1.08] tracking-tight transition-all-custom duration-1000 delay-100 ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Trustless Escrow.<br />
            <span className="italic font-light">Instant</span>{' '}
            <span className="font-bold text-gradient relative inline-block">Settlements.</span>
          </h1>

          {/* Subheading */}
          <p className={`mt-8 max-w-xl text-slate-600 font-outfit text-base sm:text-lg leading-relaxed transition-all-custom duration-1000 delay-200 ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            An autonomous on-chain agent that manages event escrows, ticket check-ins, and payout settlements automatically. Eliminate counterparty risk and experience programmable capital.
          </p>

          {/* CTA */}
          <div className={`mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center transition-all-custom duration-1000 delay-300 ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <button 
              onClick={onLaunchApp}
              className="group font-brand-mono text-sm font-semibold px-8 py-4 rounded-full bg-slate-950 text-white hover:bg-slate-900 active:scale-95 shadow-lg shadow-slate-950/10 flex items-center gap-2 transition-all"
            >
              Launch Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a 
              href="#how-it-works"
              className="font-outfit text-sm font-semibold text-slate-600 hover:text-slate-900 px-6 py-3 transition-colors flex items-center gap-1"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>



      {/* ANIMATED WATERFALL SECTION */}
      <section 
        ref={waterfallRef}
        className="w-full relative bg-gradient-to-b from-white via-slate-50 to-white py-16 overflow-hidden flex flex-col items-center justify-center"
      >
        {/* Waterfall Container */}
        <div className={`w-full max-w-5xl mx-auto px-4 md:px-8 transition-all-custom duration-1000 delay-100 ${
          waterfallVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          {/* Title tag above waterfall */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="text-left">
              <span className="font-brand-mono text-xs uppercase tracking-widest text-slate-400">Interactive Visualization</span>
              <h2 className="font-serif-fancy text-3xl md:text-4xl text-slate-800 mt-0.5 font-normal">On-Chain Flow Architecture</h2>
            </div>

            {/* Interactive Flow Speed Controls */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-full text-xs font-brand-mono">
              <button 
                onClick={() => setFlowSpeed('slow')}
                className={`px-3 py-1 rounded-full transition-all ${flowSpeed === 'slow' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Serene
              </button>
              <button 
                onClick={() => setFlowSpeed('normal')}
                className={`px-3 py-1 rounded-full transition-all ${flowSpeed === 'normal' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Normal
              </button>
              <button 
                onClick={() => setFlowSpeed('fast')}
                className={`px-3 py-1 rounded-full transition-all ${flowSpeed === 'fast' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Rapid
              </button>
            </div>
          </div>

          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-slate-200/50 shadow-2xl bg-[#eff6ff]/40">
            {/* The SVG Artwork */}
            <svg 
              viewBox="0 0 1000 750" 
              className="w-full h-full object-cover" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* GRADIENTS & GLOWS */}
              <defs>
                {/* Forest Left Gradient */}
                <linearGradient id="forestLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#052e16" />
                  <stop offset="50%" stopColor="#14532d" />
                  <stop offset="100%" stopColor="#15803d" />
                </linearGradient>

                {/* Forest Right Gradient */}
                <linearGradient id="forestRightGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#064e3b" />
                  <stop offset="50%" stopColor="#065f46" />
                  <stop offset="100%" stopColor="#0f9f6e" />
                </linearGradient>

                {/* Forest Light Accent */}
                <linearGradient id="forestLightAccent" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
                </linearGradient>

                {/* Waterfall stream color */}
                <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="40%" stopColor="#e0f7fa" />
                  <stop offset="80%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>

                {/* Waterfall Edge Shift Gradient */}
                <linearGradient id="waterfallSideGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                  <stop offset="25%" stopColor="#ffffff" />
                  <stop offset="75%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
                </linearGradient>

                {/* Rock Gradient */}
                <linearGradient id="rockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
                <linearGradient id="rockGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>

                {/* Pool Base Gradient */}
                <linearGradient id="poolGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
                  <stop offset="30%" stopColor="#0891b2" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0e3a47" />
                </linearGradient>

                {/* Soft glow filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="mistGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="20" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* BACKGROUND SKY/GRADIENT */}
              <rect width="1000" height="750" fill="#f8fafc" />
              <circle cx="500" cy="180" r="300" fill="#e0f2fe" opacity="0.4" filter="url(#glow)" />

              {/* WATERFALL POOL (BOTTOM LAYER) */}
              <rect x="0" y="580" width="1000" height="170" fill="url(#poolGrad)" />
              
              {/* Pool Ripples */}
              <ellipse cx="500" cy="620" rx="350" ry="25" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" className="pool-ripple-path" />
              <ellipse cx="500" cy="640" rx="420" ry="30" stroke="#22d3ee" strokeOpacity="0.15" strokeWidth="3" className="pool-ripple-path" style={{ animationDelay: '1.5s' }} />
              <ellipse cx="500" cy="610" rx="200" ry="12" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" className="pool-ripple-path" style={{ animationDelay: '0.5s' }} />

              {/* ROCKS - STAGE 1 (BACKGROUND ROCKS) */}
              {/* Left Back Rock */}
              <path d="M 120 580 C 180 500, 320 500, 380 580 Z" fill="url(#rockGradDark)" />
              {/* Right Back Rock */}
              <path d="M 620 580 C 680 490, 820 490, 880 580 Z" fill="url(#rockGradDark)" />

              {/* WATERFALL CORE STRUCTURE */}
              
              {/* Main flow background (Upper part) */}
              <path d="M 440 100 L 560 100 L 560 380 L 440 380 Z" fill="url(#waterGrad)" opacity="0.2" />

              {/* ROCKS - STAGE 2 (MID GROUND CASCADES) */}
              {/* Left Middle Cascade Rock */}
              <path d="M 280 420 L 480 420 C 490 420, 500 430, 500 440 L 500 480 L 260 480 Z" fill="url(#rockGrad)" />
              <path d="M 270 420 L 470 420" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              
              {/* Right Middle Cascade Rock */}
              <path d="M 500 450 L 720 450 L 730 480 L 480 480 Z" fill="url(#rockGrad)" />
              <path d="M 515 450 L 710 450" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />

              {/* Central Pillar Rock (Where frog sits) */}
              <path d="M 470 380 Q 500 370 530 380 Q 560 460 550 560 Q 480 570 450 560 Q 440 460 470 380 Z" fill="url(#rockGradDark)" />
              <path d="M 475 385 Q 500 378 525 385" stroke="#94a3b8" strokeWidth="2" />

              {/* FROG DETAIL (Sits on top of the Central Pillar Rock) - WITH INTERACTIVE EASTER EGG */}
              <g 
                transform={`translate(488, ${frogClicked ? '342' : '350'}) scale(1.1)`}
                className="cursor-pointer group transition-transform duration-300"
                onClick={() => setFrogClicked(!frogClicked)}
              >
                {/* Tooltip on click/hover */}
                {frogClicked && (
                  <g transform="translate(-30, -25)">
                    <rect width="110" height="20" rx="4" fill="#0f172a" opacity="0.9" />
                    <text x="55" y="13" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                      Ribbit! Escrow Verified 🐸
                    </text>
                  </g>
                )}
                {/* Back leg */}
                <ellipse cx="6" cy="18" rx="8" ry="4" fill="#16a34a" transform="rotate(-30 6 18)" />
                <ellipse cx="22" cy="18" rx="8" ry="4" fill="#16a34a" transform="rotate(30 22 18)" />
                {/* Body */}
                <ellipse cx="14" cy="15" rx="11" ry="8" fill="#22c55e" />
                {/* Belly */}
                <ellipse cx="14" cy="17" rx="7" ry="5" fill="#bbf7d0" />
                {/* Head */}
                <circle cx="14" cy="9" r="6" fill="#22c55e" />
                {/* Eyes */}
                <circle cx="9" cy="5" r="3.5" fill="#16a34a" />
                <circle cx="9" cy="5" r="2" fill="#ef4444" /> {/* Red pupil */}
                <circle cx="9" cy="4" r="0.7" fill="#ffffff" /> {/* Eye shine */}
                <circle cx="19" cy="5" r="3.5" fill="#16a34a" />
                <circle cx="19" cy="5" r="2" fill="#ef4444" /> {/* Red pupil */}
                <circle cx="19" cy="4" r="0.7" fill="#ffffff" /> {/* Eye shine */}
                {/* Smile */}
                <path d="M 11 11 Q 14 13 17 11" stroke="#15803d" strokeWidth="1" strokeLinecap="round" fill="none" />
                {/* Front arms */}
                <line x1="10" y1="17" x2="8" y2="22" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="18" y1="17" x2="20" y2="22" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
              </g>

              {/* WATERFALL STREAKS (ANIMATED VIA CSS) */}
              
              {/* Upper Main Waterfall Drop */}
              <g opacity="0.95">
                {/* Solid water sheet backdrop */}
                <path d="M 450 100 Q 500 95 550 100 L 540 375 L 460 375 Z" fill="url(#waterfallSideGlow)" />
                
                {/* Streaks falling down */}
                <path d="M 465 100 L 472 375" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" className="water-stream" />
                <path d="M 485 100 L 488 375" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" className="water-stream-fast" />
                <path d="M 500 102 L 500 375" stroke="#dbfcff" strokeWidth="5" strokeLinecap="round" className="water-stream-slow" />
                <path d="M 515 100 L 512 375" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" className="water-stream" />
                <path d="M 535 100 L 528 375" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" className="water-stream-fast" />
                
                {/* Gradient Side glow accent streaks */}
                <path d="M 453 100 L 462 375" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" className="water-stream-slow" />
                <path d="M 547 100 L 538 375" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" className="water-stream" />
              </g>

              {/* UPPER SPLASH LAYER (Foam cloud at the base of Upper Drop, hitting rocks) */}
              <g className="splash-foam" transform="translate(0, -5)">
                <ellipse cx="465" cy="380" rx="18" ry="12" fill="#ffffff" filter="url(#glow)" />
                <ellipse cx="500" cy="378" rx="28" ry="15" fill="#ffffff" />
                <ellipse cx="535" cy="380" rx="18" ry="12" fill="#ffffff" filter="url(#glow)" />
                <ellipse cx="482" cy="383" rx="14" ry="10" fill="#e0f7fa" />
                <ellipse cx="518" cy="383" rx="14" ry="10" fill="#f3e8ff" />
              </g>

              {/* Lower Cascade Left (falls from left mid rock to lake) */}
              <g opacity="0.9">
                <path d="M 290 422 L 350 595 L 305 595 L 265 422 Z" fill="url(#waterfallSideGlow)" />
                
                <path d="M 275 422 L 312 595" stroke="#ffffff" strokeWidth="3.5" className="water-stream-fast" />
                <path d="M 288 422 L 328 595" stroke="#dbfcff" strokeWidth="4" className="water-stream" />
                <path d="M 302 422 L 342 595" stroke="#ffffff" strokeWidth="3" className="water-stream-slow" />
                <path d="M 268 422 L 306 595" stroke="#22d3ee" strokeWidth="2" opacity="0.7" className="water-stream-fast" />
              </g>

              {/* Lower Cascade Right (falls from right mid rock to lake) */}
              <g opacity="0.9">
                <path d="M 710 452 L 670 600 L 610 600 L 675 452 Z" fill="url(#waterfallSideGlow)" />
                
                <path d="M 698 452 L 658 600" stroke="#ffffff" strokeWidth="4" className="water-stream-fast" />
                <path d="M 682 452 L 642 600" stroke="#dbfcff" strokeWidth="3" className="water-stream-slow" />
                <path d="M 665 452 L 625 600" stroke="#ffffff" strokeWidth="4.5" className="water-stream" />
                <path d="M 708 452 L 666 600" stroke="#a855f7" strokeWidth="2" opacity="0.7" className="water-stream-fast" />
              </g>

              {/* Center Splattering Cascade (falls from central frog rock to lake) */}
              <g opacity="0.95">
                <path d="M 458 560 C 470 558, 520 558, 532 560 L 515 620 L 475 620 Z" fill="url(#waterfallSideGlow)" />
                <path d="M 470 560 L 485 620" stroke="#ffffff" strokeWidth="4.5" className="water-stream" />
                <path d="M 495 560 L 498 620" stroke="#dbfcff" strokeWidth="3" className="water-stream-fast" />
                <path d="M 520 560 L 510 620" stroke="#ffffff" strokeWidth="4" className="water-stream-slow" />
              </g>

              {/* LAKE SPLASH FOAM (Foam clouds at the bottom pool) */}
              {/* Left Cascade Splash */}
              <g className="splash-foam">
                <circle cx="310" cy="595" r="16" fill="#ffffff" />
                <circle cx="330" cy="598" r="12" fill="#ffffff" />
                <circle cx="295" cy="598" r="10" fill="#e0f7fa" />
              </g>
              {/* Right Cascade Splash */}
              <g className="splash-foam">
                <circle cx="640" cy="600" r="18" fill="#ffffff" />
                <circle cx="620" cy="602" r="12" fill="#ffffff" />
                <circle cx="658" cy="601" r="11" fill="#f3e8ff" />
              </g>
              {/* Center Cascade Splash */}
              <g className="splash-foam" style={{ animationDelay: '0.6s' }}>
                <ellipse cx="495" cy="615" rx="35" ry="14" fill="#ffffff" filter="url(#glow)" />
                <ellipse cx="475" cy="618" rx="20" ry="10" fill="#e0f7fa" />
                <ellipse cx="515" cy="618" rx="20" ry="10" fill="#f3e8ff" />
              </g>

              {/* FOREST CANOPIES (FRAMING LEFT & RIGHT) */}
              
              {/* LEFT CANOPY LAYER 1 (Deepest Background Canopy) */}
              <g fill="url(#forestLeftGrad)" opacity="0.95">
                <path d="M 0 0 L 250 0 C 250 150, 180 220, 120 300 C 80 350, 60 480, 0 540 Z" />
                {/* Cloud-like tree humps */}
                <circle cx="150" cy="80" r="70" />
                <circle cx="210" cy="140" r="60" />
                <circle cx="140" cy="220" r="65" />
                <circle cx="80" cy="330" r="55" />
                <circle cx="70" cy="410" r="50" />
                <circle cx="30" cy="490" r="45" />
              </g>

              {/* RIGHT CANOPY LAYER 1 (Deepest Background Canopy) */}
              <g fill="url(#forestRightGrad)" opacity="0.95">
                <path d="M 1000 0 L 750 0 C 750 150, 820 220, 880 300 C 920 350, 940 480, 1000 540 Z" />
                {/* Cloud-like tree humps */}
                <circle cx="850" cy="80" r="75" />
                <circle cx="790" cy="150" r="65" />
                <circle cx="860" cy="230" r="60" />
                <circle cx="910" cy="320" r="55" />
                <circle cx="930" cy="410" r="48" />
                <circle cx="970" cy="490" r="40" />
              </g>

              {/* LEFT CANOPY LAYER 2 (Mid-ground Canopy) */}
              <g fill="#14532d" opacity="0.98">
                <circle cx="80" cy="60" r="75" />
                <circle cx="130" cy="120" r="65" />
                <circle cx="150" cy="190" r="50" />
                <circle cx="90" cy="270" r="55" />
                <circle cx="45" cy="360" r="50" />
                <circle cx="20" cy="450" r="40" />
                {/* Connecting fill path */}
                <path d="M 0 0 Q 140 100 130 200 Q 80 320 20 400 L 0 450 Z" />
              </g>

              {/* RIGHT CANOPY LAYER 2 (Mid-ground Canopy) */}
              <g fill="#065f46" opacity="0.98">
                <circle cx="920" cy="60" r="75" />
                <circle cx="870" cy="120" r="60" />
                <circle cx="850" cy="180" r="52" />
                <circle cx="910" cy="260" r="55" />
                <circle cx="955" cy="350" r="48" />
                <circle cx="980" cy="440" r="40" />
                {/* Connecting fill path */}
                <path d="M 1000 0 Q 860 100 870 200 Q 920 320 980 400 L 1000 450 Z" />
              </g>

              {/* LEFT CANOPY LAYER 3 (Foreground Canopy - Darkest Green) */}
              <g fill="#022c22">
                <circle cx="40" cy="100" r="60" />
                <circle cx="80" cy="160" r="50" />
                <circle cx="100" cy="220" r="45" />
                <circle cx="40" cy="310" r="55" />
                <circle cx="10" cy="390" r="40" />
                <path d="M 0 0 C 80 80, 80 180, 50 250 C 20 300, 10 350, 0 400 Z" />
              </g>

              {/* RIGHT CANOPY LAYER 3 (Foreground Canopy - Darkest Green) */}
              <g fill="#022c22">
                <circle cx="960" cy="100" r="60" />
                <circle cx="920" cy="160" r="50" />
                <circle cx="900" cy="220" r="45" />
                <circle cx="960" cy="310" r="55" />
                <circle cx="990" cy="390" r="40" />
                <path d="M 1000 0 C 920 80, 920 180, 950 250 C 980 300, 990 350, 1000 400 Z" />
              </g>

              {/* Foreground tree canopy leaves overlays (lighting effects) */}
              <circle cx="130" cy="120" r="65" fill="url(#forestLightAccent)" />
              <circle cx="870" cy="120" r="60" fill="url(#forestLightAccent)" />

              {/* GLOWING MIST & GLOW PARTICLES (BASE OF WATERFALL) */}
              <g opacity="0.35" filter="url(#mistGlow)">
                {/* A massive cyan/white soft mist background */}
                <ellipse cx="500" cy="600" rx="140" ry="60" fill="#22d3ee" />
                <ellipse cx="500" cy="590" rx="90" ry="40" fill="#ffffff" />
              </g>

              {/* Tiny glowing mist sparkle particles */}
              <g>
                <circle cx="480" cy="580" r="4" fill="#ffffff" className="mist-bubble" style={{ animationDelay: '0.2s', animationDuration: '2.5s' }} />
                <circle cx="520" cy="570" r="3" fill="#e0f7fa" className="mist-bubble" style={{ animationDelay: '0.8s', animationDuration: '3.5s' }} />
                <circle cx="460" cy="590" r="5" fill="#ffffff" className="mist-bubble" style={{ animationDelay: '1.2s', animationDuration: '2.8s' }} />
                <circle cx="500" cy="560" r="2" fill="#ffffff" className="mist-bubble" style={{ animationDelay: '0.1s', animationDuration: '4s' }} />
                <circle cx="535" cy="585" r="4" fill="#e0f7fa" className="mist-bubble" style={{ animationDelay: '1.7s', animationDuration: '3.1s' }} />
                <circle cx="450" cy="575" r="2" fill="#dbfcff" className="mist-bubble" style={{ animationDelay: '2.3s', animationDuration: '2.2s' }} />
                
                {/* Near middle splash */}
                <circle cx="475" cy="370" r="2.5" fill="#ffffff" className="mist-bubble" style={{ animationDelay: '0.4s', animationDuration: '2s' }} />
                <circle cx="525" cy="370" r="3" fill="#ffffff" className="mist-bubble" style={{ animationDelay: '0.9s', animationDuration: '2.7s' }} />
              </g>

              {/* FLOATING LIGHT PARTICLES / FIREFLIES OVER CANOPY */}
              <g filter="url(#glow)">
                {/* Left Canopy Fireflies */}
                <circle cx="160" cy="200" r="5" fill="#a7f3d0" className="firefly-1" style={{ filter: 'drop-shadow(0 0 4px #10b981)' }} />
                <circle cx="100" cy="320" r="3.5" fill="#34d399" className="firefly-2" style={{ filter: 'drop-shadow(0 0 3px #059669)' }} />
                <circle cx="60" cy="150" r="4.5" fill="#a7f3d0" className="firefly-3" style={{ filter: 'drop-shadow(0 0 4px #10b981)' }} />
                <circle cx="140" cy="400" r="3" fill="#6ee7b7" className="firefly-1" style={{ animationDelay: '2.5s', filter: 'drop-shadow(0 0 3px #10b981)' }} />

                {/* Right Canopy Fireflies */}
                <circle cx="840" cy="200" r="4" fill="#fef08a" className="firefly-2" style={{ filter: 'drop-shadow(0 0 4px #eab308)' }} />
                <circle cx="900" cy="320" r="5.5" fill="#fde047" className="firefly-3" style={{ filter: 'drop-shadow(0 0 5px #ca8a04)' }} />
                <circle cx="860" cy="420" r="3" fill="#fef08a" className="firefly-1" style={{ animationDelay: '1s', filter: 'drop-shadow(0 0 3px #eab308)' }} />
                <circle cx="940" cy="140" r="4.5" fill="#fef08a" className="firefly-3" style={{ animationDelay: '3.2s', filter: 'drop-shadow(0 0 4px #eab308)' }} />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* PRODUCT FEATURES SECTION */}
      <section id="product" className="py-24 bg-white border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <span className="font-brand-mono text-xs font-semibold text-cyan-600 tracking-widest uppercase">Autonomous Escrow Agent</span>
            <h2 className="font-serif-fancy text-4xl sm:text-5xl text-slate-900 mt-2 font-normal">
              Eliminate Counterparty Risk with Decentralized Settlements
            </h2>
            <p className="font-outfit text-slate-600 mt-4 text-base">
              Aegis Waterfall coordinates payments on-chain, release funds according to cryptographic check-in attestations, and automates audits using state-of-the-art AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/50 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-brand-mono text-base font-semibold text-slate-900">Autonomous Escrow</h3>
              <p className="font-outfit text-sm text-slate-600 mt-3 leading-relaxed">
                Funds are held in on-chain smart contracts. Payouts are controlled dynamically based on check-ins, rendering theft or organizer defaults mathematically impossible.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-brand-mono text-base font-semibold text-slate-900">Instant Settlements</h3>
              <p className="font-outfit text-sm text-slate-600 mt-3 leading-relaxed">
                No more waiting weeks for ticket revenue or vendor payments. Capital is released programmatically in real-time as users attests and check-in to events.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/50 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-brand-mono text-base font-semibold text-slate-900">AI-Controlled Treasury</h3>
              <p className="font-outfit text-sm text-slate-600 mt-3 leading-relaxed">
                An LLM-based autonomous supervisor reviews vendor invoices, checks against budget boundaries, and issues attestation-based payouts with full audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5">
              <span className="font-brand-mono text-xs font-semibold text-cyan-600 tracking-widest uppercase">Operational Pipeline</span>
              <h2 className="font-serif-fancy text-4xl sm:text-5xl text-slate-900 mt-2 font-normal">
                How Aegis Waterfall Secures Transactions
              </h2>
              <p className="font-outfit text-slate-600 mt-4 text-base">
                A seamless flow of funds that mirrors a natural waterfall, cascading down through milestone verifications until final settlement is completed.
              </p>

              <div className="mt-8 flex flex-col gap-4 font-brand-mono text-xs">
                <button 
                  onClick={() => setActiveTab('create')}
                  className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                    activeTab === 'create' 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>1. Escrow Creation</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setActiveTab('deposit')}
                  className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                    activeTab === 'deposit' 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>2. Attendee RSVPs & Deposits</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setActiveTab('settle')}
                  className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                    activeTab === 'settle' 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>3. Verification & Payout</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Showcase Box */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl relative min-h-[350px] flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-t-3xl"></div>
              
              {activeTab === 'create' && (
                <div className="animate-fadeIn">
                  <div className="flex items-center gap-3 text-cyan-600 mb-6">
                    <Layers className="w-6 h-6" />
                    <span className="font-brand-mono text-xs font-bold uppercase tracking-wider">Milestone 1</span>
                  </div>
                  <h3 className="font-serif-fancy text-2xl text-slate-900 font-semibold">Deploy Escrow to Arc Testnet</h3>
                  <p className="font-outfit text-sm text-slate-600 mt-4 leading-relaxed">
                    Organizers deploy an event configuration defining the ticket price, endTime, and budget limits. The smart contract acts as a neutral treasury box, locked on-chain and managed autonomously.
                  </p>
                  <ul className="mt-6 flex flex-col gap-2.5 text-xs text-slate-600 font-brand-mono">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Multi-sig & Agent controlled keys
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Configurable budget thresholds
                    </li>
                  </ul>
                </div>
              )}

              {activeTab === 'deposit' && (
                <div className="animate-fadeIn">
                  <div className="flex items-center gap-3 text-purple-600 mb-6">
                    <RefreshCw className="w-6 h-6" />
                    <span className="font-brand-mono text-xs font-bold uppercase tracking-wider">Milestone 2</span>
                  </div>
                  <h3 className="font-serif-fancy text-2xl text-slate-900 font-semibold">USDC Deposit Locking</h3>
                  <p className="font-outfit text-sm text-slate-600 mt-4 leading-relaxed">
                    Attendees secure their ticket by depositing USDC directly into the event's escrow account. Capital is locked. No central planner or event organizer can redirect these funds before the event completes.
                  </p>
                  <ul className="mt-6 flex flex-col gap-2.5 text-xs text-slate-600 font-brand-mono">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> USDC integration (Arc Network)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant event ticket RSVPs
                    </li>
                  </ul>
                </div>
              )}

              {activeTab === 'settle' && (
                <div className="animate-fadeIn">
                  <div className="flex items-center gap-3 text-cyan-600 mb-6">
                    <Sparkles className="w-6 h-6" />
                    <span className="font-brand-mono text-xs font-bold uppercase tracking-wider">Milestone 3</span>
                  </div>
                  <h3 className="font-serif-fancy text-2xl text-slate-900 font-semibold">Attestation and Auto-Payout</h3>
                  <p className="font-outfit text-sm text-slate-600 mt-4 leading-relaxed">
                    When attendees check-in, an on-chain receipt attestation is emitted. The Aegis agent immediately validates the attestation. The pool cascades down, releasing organizer payouts and vendor settlement fees instantly.
                  </p>
                  <ul className="mt-6 flex flex-col gap-2.5 text-xs text-slate-600 font-brand-mono">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Programmatic, real-time refunds/releases
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Soulbound token (SBT) audit credentials
                    </li>
                  </ul>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                <span className="font-brand-mono text-[10px] text-slate-400">STATUS: CORE PIPELINE VERIFIED</span>
                <button 
                  onClick={onLaunchApp}
                  className="font-brand-mono text-xs font-semibold px-4 py-2 rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  Test On-Chain Flow
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECHNICAL STACK SECTION */}
      <section id="docs" className="py-24 bg-white border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <span className="font-brand-mono text-xs font-semibold text-cyan-600 tracking-widest uppercase">Developers & Core Infrastructure</span>
            <h2 className="font-serif-fancy text-3xl sm:text-4xl text-slate-900 mt-2 font-normal">
              Built on Modern Web3 Primitives
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/50 text-center">
              <span className="font-brand-mono text-lg font-bold text-slate-800">Arc Network</span>
              <p className="font-outfit text-xs text-slate-500 mt-2">Ultra-fast EVM testnet for gasless programmability</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/50 text-center">
              <span className="font-brand-mono text-lg font-bold text-slate-800">EAS Protocols</span>
              <p className="font-outfit text-xs text-slate-500 mt-2">Cryptographic check-in receipt attestations</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/50 text-center">
              <span className="font-brand-mono text-lg font-bold text-slate-800">SBT Gallery</span>
              <p className="font-outfit text-xs text-slate-500 mt-2">Verifiable soulbound badges for on-chain identity</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/50 text-center">
              <span className="font-brand-mono text-lg font-bold text-slate-800">Supabase DB</span>
              <p className="font-outfit text-xs text-slate-500 mt-2">Realtime sync, secure schema storage and audits</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY CALL-TO-ACTION */}
      <section id="community" className="py-24 bg-gradient-to-tr from-slate-900 to-slate-950 text-white relative overflow-hidden">
        {/* Subtle glowing lights in background */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-serif-fancy text-4xl sm:text-5xl font-normal text-white">
            Ready to experience the future of <span className="italic font-light text-cyan-400">programmable capital</span>?
          </h2>
          <p className="font-outfit text-slate-400 mt-6 max-w-xl mx-auto text-base">
            Launch the app to configure event parameters, run manual attendee check-ins, upload vendor invoices, and see our autonomous agent execute payouts in real-time.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={onLaunchApp}
              className="font-brand-mono text-sm font-semibold px-8 py-4 rounded-full bg-gradient-to-r from-cyan-400 to-purple-600 text-white hover:opacity-95 active:scale-95 shadow-lg shadow-cyan-500/10 transition-all"
            >
              Get Started Now
            </button>
            <button 
              onClick={onLaunchApp}
              className="font-brand-mono text-sm font-semibold px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-500 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onLaunchApp}>
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[12px] font-bold">waterfall_chart</span>
            </div>
            <span className="font-brand-mono text-xs font-bold tracking-tight text-white uppercase">
              AEGIS WATERFALL
            </span>
          </div>

          <div className="font-outfit text-xs text-slate-400">
            &copy; 2026 Aegis Waterfall. Built for Encode x Arc "Programmable Money Hackathon".
          </div>

          <div className="flex gap-6 font-brand-mono text-xs">
            <a href="#product" className="hover:text-white transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Docs</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
