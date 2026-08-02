import { useState, useEffect, useRef } from 'react';

interface LandingPageProps {
  onLaunchApp: (startingView?: 'dashboard' | 'events' | 'treasury' | 'audit') => void;
  isConnected: boolean;
}

export function LandingPage({ onLaunchApp, isConnected }: LandingPageProps) {
  const [flowSpeed, setFlowSpeed] = useState<'normal' | 'fast' | 'slow'>('normal');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll animations Intersection Observer refs & states
  const heroRef = useRef<HTMLDivElement>(null);
  const waterfallRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const docsRef = useRef<HTMLDivElement>(null);
  const communityRef = useRef<HTMLDivElement>(null);

  const [heroVisible, setHeroVisible] = useState(false);
  const [waterfallVisible, setWaterfallVisible] = useState(false);
  const [productVisible, setProductVisible] = useState(false);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const [docsVisible, setDocsVisible] = useState(false);
  const [communityVisible, setCommunityVisible] = useState(false);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const observers = [
      new IntersectionObserver(([e]) => e.isIntersecting && setHeroVisible(true), observerOptions),
      new IntersectionObserver(([e]) => e.isIntersecting && setWaterfallVisible(true), observerOptions),
      new IntersectionObserver(([e]) => e.isIntersecting && setProductVisible(true), observerOptions),
      new IntersectionObserver(([e]) => e.isIntersecting && setHowItWorksVisible(true), observerOptions),
      new IntersectionObserver(([e]) => e.isIntersecting && setDocsVisible(true), observerOptions),
      new IntersectionObserver(([e]) => e.isIntersecting && setCommunityVisible(true), observerOptions),
    ];

    if (heroRef.current) observers[0].observe(heroRef.current);
    if (waterfallRef.current) observers[1].observe(waterfallRef.current);
    if (productRef.current) observers[2].observe(productRef.current);
    if (howItWorksRef.current) observers[3].observe(howItWorksRef.current);
    if (docsRef.current) observers[4].observe(docsRef.current);
    if (communityRef.current) observers[5].observe(communityRef.current);

    return () => {
      observers.forEach(obs => obs.disconnect());
    };
  }, []);

  // Compute animation duration based on flowSpeed
  const flowDuration = flowSpeed === 'fast' ? '1s' : flowSpeed === 'slow' ? '6s' : '3s';

  return (
    <div className="antialiased min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white relative overflow-x-hidden font-body">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;700&family=Outfit:wght@300;400;600&display=swap');

        :root {
          --font-heading: 'Instrument Serif', serif;
          --font-brand: 'JetBrains Mono', monospace;
          --font-body: 'Outfit', sans-serif;
        }

        .font-heading {
          font-family: var(--font-heading);
        }
        .font-brand {
          font-family: var(--font-brand);
        }
        .font-body {
          font-family: var(--font-body);
        }

        /* Divide Seam transition */
        .divide-seam-top {
          position: absolute;
          top: -1px;
          left: 0;
          width: 100%;
          overflow: hidden;
          line-height: 0;
        }
        .divide-seam-top svg {
          position: relative;
          display: block;
          width: calc(100% + 1.3px);
          height: 60px;
        }
        @media (min-width: 768px) {
          .divide-seam-top svg { height: 120px; }
        }

        .divide-seam-bottom {
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          overflow: hidden;
          line-height: 0;
          transform: rotate(180deg);
        }
        .divide-seam-bottom svg {
          position: relative;
          display: block;
          width: calc(100% + 1.3px);
          height: 60px;
        }
        @media (min-width: 768px) {
          .divide-seam-bottom svg { height: 120px; }
        }

        /* Pulse animation */
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .animate-pulse-dot {
          animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Invert Hover Button */
        .btn-invert {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 2rem;
          font-family: var(--font-brand);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .bg-black .btn-invert {
          background-color: #fff;
          color: #000;
          border: 2px solid #fff;
        }
        .bg-black .btn-invert:hover {
          background-color: #000;
          color: #fff;
        }

        .bg-white .btn-invert {
          background-color: #000;
          color: #fff;
          border: 2px solid #000;
        }
        .bg-white .btn-invert:hover {
          background-color: #fff;
          color: #000;
        }
        
        .section-container {
          position: relative;
          padding-top: 6rem;
          padding-bottom: 6rem;
        }
        
        .section-padded {
          padding-top: 10rem;
          padding-bottom: 10rem;
        }

        /* Scroll reveal class animations */
        .scroll-reveal {
          opacity: 0;
          transform: translateY(35px);
          transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scroll-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 mix-blend-difference px-6 py-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onLaunchApp('dashboard')}>
          <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white"></div>
          </div>
          <span className="font-brand font-bold tracking-widest uppercase text-lg">Aegis</span>
        </div>
        <nav className="hidden md:flex gap-8 font-brand text-sm tracking-widest uppercase">
          <a className="hover:opacity-70 transition-opacity" href="#features">Features</a>
          <a className="hover:opacity-70 transition-opacity" href="#process">Process</a>
          <a className="hover:opacity-70 transition-opacity" href="#stack">Stack</a>
        </nav>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onLaunchApp('dashboard')}
            className="font-brand text-sm tracking-widest uppercase border-b border-white pb-1 hover:opacity-70 transition-opacity"
          >
            {isConnected ? 'Go to Dashboard' : 'Get Started'}
          </button>
          
          {/* Mobile hamburger menu toggle button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white hover:opacity-75 focus:outline-none"
            aria-label="Toggle Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-lg flex flex-col justify-center items-center gap-8 font-brand text-xl tracking-widest uppercase text-white animate-fadeIn">
          <a className="hover:opacity-70 transition-opacity" href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a className="hover:opacity-70 transition-opacity" href="#process" onClick={() => setMobileMenuOpen(false)}>Process</a>
          <a className="hover:opacity-70 transition-opacity" href="#stack" onClick={() => setMobileMenuOpen(false)}>Stack</a>
          <button 
            onClick={() => { setMobileMenuOpen(false); onLaunchApp('dashboard'); }}
            className="btn-invert mt-4"
          >
            {isConnected ? 'Launch App' : 'Connect Wallet'}
          </button>
        </div>
      )}

      {/* Hero Section (Black) */}
      <section 
        ref={heroRef}
        className="bg-black text-white min-h-screen flex items-center justify-center relative section-container"
      >
        <div className={`max-w-5xl mx-auto px-6 text-center z-10 flex flex-col items-center scroll-reveal ${heroVisible ? 'is-visible' : ''}`}>
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-zinc-800 mb-8">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse-dot"></div>
            <span className="font-brand text-xs tracking-widest uppercase text-zinc-400">Escrow Protocol Active</span>
          </div>
          <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl mb-6 tracking-tight">
            Autonomous Escrow.<br />
            <span className="italic text-zinc-500">Decentralized Trust.</span>
          </h1>
          <p className="font-brand text-zinc-400 tracking-widest uppercase mb-12 max-w-2xl mx-auto">
            Aegis Waterfall introduces a programmatic approach to event funding, ticket deposits, and automated smart contract settlements.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="btn-invert" onClick={() => onLaunchApp('dashboard')}>Launch Dashboard</button>
            <button 
              className="btn-invert bg-transparent border-zinc-700 text-zinc-400 hover:text-white hover:border-white hover:bg-transparent"
              onClick={() => onLaunchApp('events')}
            >
              Explore Event Escrows
            </button>
          </div>
        </div>
      </section>

      {/* Waterfall Illustration (White) */}
      <section 
        ref={waterfallRef}
        className="bg-white text-black relative section-container section-padded"
      >
        <div className="divide-seam-top text-black">
          <svg data-name="Layer 1" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor"></path>
          </svg>
        </div>
        <div className={`max-w-6xl mx-auto px-6 relative z-10 scroll-reveal ${waterfallVisible ? 'is-visible' : ''}`}>
          <div className="text-center mb-10">
            <h2 className="font-heading text-5xl md:text-7xl mb-4">The Escrow Flow</h2>
            <p className="font-brand text-zinc-500 tracking-widest uppercase text-sm mb-6">Autonomous pipeline distribution</p>

            {/* Interactive Flow Speed Controls */}
            <div className="flex justify-center items-center gap-1.5 p-1 bg-zinc-100 border border-zinc-200 rounded-full text-[10px] font-brand max-w-[240px] mx-auto">
              <button 
                onClick={() => setFlowSpeed('slow')}
                className={`px-3 py-1 rounded-full transition-all ${flowSpeed === 'slow' ? 'bg-black text-white shadow-sm font-semibold' : 'text-zinc-600 hover:text-zinc-900'}`}
              >
                Serene
              </button>
              <button 
                onClick={() => setFlowSpeed('normal')}
                className={`px-3 py-1 rounded-full transition-all ${flowSpeed === 'normal' ? 'bg-black text-white shadow-sm font-semibold' : 'text-zinc-600 hover:text-zinc-900'}`}
              >
                Normal
              </button>
              <button 
                onClick={() => setFlowSpeed('fast')}
                className={`px-3 py-1 rounded-full transition-all ${flowSpeed === 'fast' ? 'bg-black text-white shadow-sm font-semibold' : 'text-zinc-600 hover:text-zinc-900'}`}
              >
                Rapid
              </button>
            </div>
          </div>
          
          <div className="w-full aspect-video bg-zinc-100 rounded-3xl overflow-hidden border border-zinc-200 flex items-center justify-center p-4">
            {/* Interactive Web3 Pipeline Escrow Waterfall SVG */}
            <svg className="w-full h-full" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Define curves paths */}
              {/* Path 1: Deposits (Left Node) to Escrow Core */}
              <path id="deposits-to-core" d="M 185 90 C 260 90, 260 200, 340 200" fill="none" stroke="#e4e4e7" strokeWidth="3" />
              {/* Path 2: Check-In Oracle (Right Node) to Escrow Core */}
              <path id="oracle-to-core" d="M 615 90 C 540 90, 540 200, 460 200" fill="none" stroke="#e4e4e7" strokeWidth="3" />
              {/* Path 3: Escrow Core to Payout Outflow */}
              <path id="core-to-payout" d="M 380 260 C 380 320, 280 320, 245 320" fill="none" stroke="#e4e4e7" strokeWidth="3" />
              {/* Path 4: Escrow Core to Vendor Outflow */}
              <path id="core-to-vendor" d="M 420 260 C 420 320, 520 320, 555 320" fill="none" stroke="#e4e4e7" strokeWidth="3" />

              {/* Glowing particles flowing down the lines */}
              {/* Deposits to Escrow core flow */}
              <circle r="6" fill="#000000" filter="url(#glow-effect)">
                <animateMotion href="#deposits-to-core" dur={flowDuration} repeatCount="indefinite" />
              </circle>
              <circle r="4" fill="#ffffff" style={{ animationDelay: '0.5s' }}>
                <animateMotion href="#deposits-to-core" dur={flowDuration} repeatCount="indefinite" />
              </circle>

              {/* Oracle to Escrow core flow */}
              <circle r="6" fill="#000000" filter="url(#glow-effect)">
                <animateMotion href="#oracle-to-core" dur={flowDuration} repeatCount="indefinite" />
              </circle>
              <circle r="4" fill="#ffffff" style={{ animationDelay: '0.8s' }}>
                <animateMotion href="#oracle-to-core" dur={flowDuration} repeatCount="indefinite" />
              </circle>

              {/* Core to Payout outflow flow */}
              <circle r="6" fill="#000000" filter="url(#glow-effect)">
                <animateMotion href="#core-to-payout" dur={flowDuration} repeatCount="indefinite" />
              </circle>
              <circle r="4" fill="#ffffff" style={{ animationDelay: '0.3s' }}>
                <animateMotion href="#core-to-payout" dur={flowDuration} repeatCount="indefinite" />
              </circle>

              {/* Core to Vendor outflow flow */}
              <circle r="6" fill="#000000" filter="url(#glow-effect)">
                <animateMotion href="#core-to-vendor" dur={flowDuration} repeatCount="indefinite" />
              </circle>
              <circle r="4" fill="#ffffff" style={{ animationDelay: '1.1s' }}>
                <animateMotion href="#core-to-vendor" dur={flowDuration} repeatCount="indefinite" />
              </circle>

              {/* Left Input Node: Deposits */}
              <g transform="translate(140, 90)">
                <circle cx="0" cy="0" r="45" fill="#000000" stroke="#000000" strokeWidth="2" />
                <circle cx="0" cy="0" r="41" fill="#f4f4f5" />
                <text x="0" y="-8" fill="#000000" fontSize="9" fontFamily="var(--font-brand)" fontWeight="bold" textAnchor="middle">USDC</text>
                <text x="0" y="8" fill="#52525b" fontSize="9" fontFamily="var(--font-brand)" textAnchor="middle">DEPOSITS</text>
                <circle cx="0" cy="22" r="3" fill="#18181b" />
              </g>

              {/* Right Input Node: Oracle Checkins */}
              <g transform="translate(660, 90)">
                <circle cx="0" cy="0" r="45" fill="#000000" stroke="#000000" strokeWidth="2" />
                <circle cx="0" cy="0" r="41" fill="#f4f4f5" />
                <text x="0" y="-8" fill="#000000" fontSize="9" fontFamily="var(--font-brand)" fontWeight="bold" textAnchor="middle">EAS</text>
                <text x="0" y="8" fill="#52525b" fontSize="9" fontFamily="var(--font-brand)" textAnchor="middle">ATTESTATION</text>
                <circle cx="0" cy="22" r="3" fill="#18181b" />
              </g>

              {/* Central Node: Aegis Escrow Core Shield */}
              <g transform="translate(340, 140)">
                <rect x="0" y="0" width="120" height="120" rx="16" fill="#000000" stroke="#000000" strokeWidth="2" />
                <rect x="4" y="4" width="112" height="112" rx="12" fill="#ffffff" />
                <path d="M 60 30 L 85 45 L 85 75 L 60 90 L 35 75 L 35 45 Z" fill="none" stroke="#000000" strokeWidth="2" />
                <circle cx="60" cy="60" r="8" fill="#000000" />
                <circle cx="60" cy="60" r="16" fill="none" stroke="#000000" strokeDasharray="3 3" className="animate-pulse-dot" />
                <text x="60" y="102" fill="#000000" fontSize="8" fontFamily="var(--font-brand)" fontWeight="bold" textAnchor="middle">AEGIS CORE</text>
              </g>

              {/* Bottom Outflow Node 1: Organizer Payout */}
              <g transform="translate(200, 320)">
                <circle cx="0" cy="0" r="45" fill="#000000" stroke="#000000" strokeWidth="2" />
                <circle cx="0" cy="0" r="41" fill="#f4f4f5" />
                <text x="0" y="-8" fill="#000000" fontSize="9" fontFamily="var(--font-brand)" fontWeight="bold" textAnchor="middle">ORGANIZER</text>
                <text x="0" y="8" fill="#52525b" fontSize="9" fontFamily="var(--font-brand)" textAnchor="middle">PAYOUTS</text>
                <circle cx="0" cy="-22" r="3" fill="#18181b" />
              </g>

              {/* Bottom Outflow Node 2: Vendor Settlements */}
              <g transform="translate(600, 320)">
                <circle cx="0" cy="0" r="45" fill="#000000" stroke="#000000" strokeWidth="2" />
                <circle cx="0" cy="0" r="41" fill="#f4f4f5" />
                <text x="0" y="-8" fill="#000000" fontSize="9" fontFamily="var(--font-brand)" fontWeight="bold" textAnchor="middle">VENDOR</text>
                <text x="0" y="8" fill="#52525b" fontSize="9" fontFamily="var(--font-brand)" textAnchor="middle">SETTLEMENTS</text>
                <circle cx="0" cy="-22" r="3" fill="#18181b" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* AI Treasury Auditor Section (Black) */}
      <section 
        ref={productRef} 
        id="features" 
        className="bg-black text-white relative section-container section-padded"
      >
        <div className="divide-seam-top text-black">
          <svg data-name="Layer 1" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor"></path>
          </svg>
        </div>
        <div className={`max-w-6xl mx-auto px-6 relative z-10 scroll-reveal ${productVisible ? 'is-visible' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-heading text-5xl md:text-7xl mb-8">AI Auditor</h2>
              <p className="text-xl text-zinc-400 font-light leading-relaxed mb-8">
                Aegis Waterfall deploys an autonomous AI treasury agent directly on-chain. It automatically inspects vendor invoices against set budget bounds and check-in attestations, enforcing guardrails without human intervention.
              </p>
              <ul className="space-y-6 font-brand tracking-widest text-sm text-zinc-300">
                <li className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-white">check_circle</span>
                  <span>EAS Attestation Verification</span>
                </li>
                <li className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-white">check_circle</span>
                  <span>Autonomous PDF Invoice Audits</span>
                </li>
                <li className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-white">check_circle</span>
                  <span>Programmatic Budget Guards</span>
                </li>
              </ul>
            </div>
            <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 font-brand text-xs text-zinc-400 shadow-2xl relative">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-900 mb-4">
                <span className="font-brand text-zinc-500 uppercase tracking-widest text-[9px]">AI Agent Audit Trace</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              </div>
              <pre className="text-zinc-300 leading-relaxed font-brand overflow-x-auto">
                <code>
{`[AEGIS] Initializing invoice audit...
[INFO]  Invoice ID: inv_9f2a0b1c
[INFO]  Vendor: 0x8a92...e102
[INFO]  Requested Amount: 450.00 USDC
[AUDIT] Checking budget limit... 
        Allowed: 500.00 USDC
        Result: PASSED ✓
[AUDIT] Attestation verify...
        Checked-in: 9 RSVPs
        Required: >= 1 RSVP
        Result: PASSED ✓
[DECISION] status: APPROVED
[ACTION] Emitting payout execution...
[TX]    Tx Hash: 0x4fbc71a...92b0
[STATUS] Payout complete. core locked.`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works (White) */}
      <section 
        ref={howItWorksRef} 
        id="process" 
        className="bg-white text-black relative section-container section-padded"
      >
        <div className="divide-seam-top text-white">
          <svg data-name="Layer 1" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor"></path>
          </svg>
        </div>
        <div className={`max-w-6xl mx-auto px-6 relative z-10 scroll-reveal ${howItWorksVisible ? 'is-visible' : ''}`}>
          <h2 className="font-heading text-5xl md:text-7xl mb-16 text-center">The Mechanism</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-t-2 border-black pt-6 hover:-translate-y-2 transition-transform duration-300">
              <h3 className="font-brand text-2xl font-bold mb-4">01. Split</h3>
              <p className="text-zinc-600 leading-relaxed">Data streams are immediately segregated upon entry, categorized into distinct operational states based on primary attributes.</p>
            </div>
            <div className="border-t-2 border-black pt-6 md:mt-12 hover:-translate-y-2 transition-transform duration-300">
              <h3 className="font-brand text-2xl font-bold mb-4">02. Process</h3>
              <p className="text-zinc-600 leading-relaxed">Each state is processed in isolation, preventing cross-contamination and ensuring maximum computational efficiency.</p>
            </div>
            <div className="border-t-2 border-black pt-6 md:mt-24 hover:-translate-y-2 transition-transform duration-300">
              <h3 className="font-brand text-2xl font-bold mb-4">03. Unify</h3>
              <p className="text-zinc-600 leading-relaxed">The processed nodes are stitched back together via the divide seam, creating a cohesive output from disparate inputs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Stack (Black) */}
      <section 
        ref={docsRef} 
        id="stack" 
        className="bg-black text-white relative section-container section-padded"
      >
        <div className="divide-seam-top text-black">
          <svg data-name="Layer 1" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor"></path>
          </svg>
        </div>
        <div className={`max-w-6xl mx-auto px-6 relative z-10 flex flex-col md:flex-row gap-16 items-center scroll-reveal ${docsVisible ? 'is-visible' : ''}`}>
          <div className="flex-1">
            <h2 className="font-heading text-5xl md:text-7xl mb-8">Architecture</h2>
            <div className="space-y-8">
              <div className="border-l-2 border-white pl-6 hover:border-zinc-300 transition-colors duration-300">
                <h4 className="font-brand text-lg mb-2">Core Engine</h4>
                <p className="text-zinc-400">Quantum-state logic gates handling millions of binary decisions per microsecond.</p>
              </div>
              <div className="border-l-2 border-zinc-600 pl-6 hover:border-zinc-300 transition-colors duration-300">
                <h4 className="font-brand text-lg mb-2 text-zinc-300">Memory Matrix</h4>
                <p className="text-zinc-500">High-density crystalline storage arrays configured for instantaneous retrieval.</p>
              </div>
              <div className="border-l-2 border-zinc-800 pl-6 hover:border-zinc-300 transition-colors duration-300">
                <h4 className="font-brand text-lg mb-2 text-zinc-500">Output Node</h4>
                <p className="text-zinc-600">Zero-loss transmission protocols delivering uncorrupted data streams.</p>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full bg-zinc-950 p-8 rounded-3xl border border-zinc-800 font-brand text-xs text-zinc-400 overflow-x-auto shadow-2xl">
            <pre><code>{`{
  "system": "Aegis",
  "version": "2.0.Divide",
  "status": "active",
  "metrics": {
    "latency": "0.001ms",
    "throughput": "99.99%",
    "state": "binary_locked"
  },
  "nodes": [
    "alpha_black",
    "omega_white"
  ]
}`}</code></pre>
          </div>
        </div>
      </section>

      {/* Call to Action (White) */}
      <section 
        ref={communityRef}
        id="cta"
        className="bg-white text-black relative section-container section-padded"
      >
        <div className="divide-seam-top text-white">
          <svg data-name="Layer 1" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor"></path>
          </svg>
        </div>
        <div className={`max-w-4xl mx-auto px-6 relative z-10 text-center scroll-reveal ${communityVisible ? 'is-visible' : ''}`}>
          <h2 className="font-heading text-6xl md:text-8xl mb-8">Choose Your Side</h2>
          <p className="text-xl text-zinc-600 mb-12">The dichotomy awaits. Initialize the sequence to begin.</p>
          <button className="btn-invert text-lg px-8 py-4" onClick={() => onLaunchApp('dashboard')}>Initialize Sequence</button>
        </div>
      </section>

      {/* Footer (Black) */}
      <footer className="bg-black text-white relative py-12 border-t border-zinc-900">
        <div className="divide-seam-top text-black">
          <svg data-name="Layer 1" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor"></path>
          </svg>
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-10 mt-16 border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onLaunchApp('dashboard')}>
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
            </div>
            <span className="font-brand font-bold tracking-widest uppercase text-sm">Aegis Divide</span>
          </div>
          <p className="font-brand text-zinc-600 text-xs tracking-widest uppercase">© 2026 Aegis Systems. All rights reserved.</p>
          <div className="flex gap-4 font-brand text-xs tracking-widest uppercase text-zinc-400">
            <a className="hover:text-white transition-colors" href="https://twitter.com" target="_blank" rel="noreferrer">Twitter</a>
            <a className="hover:text-white transition-colors" href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
