import React, { useState, useEffect } from 'react';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract 
} from 'wagmi';
import { parseUnits, formatUnits, keccak256, toHex } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { supabase } from './supabase';
import toast, { Toaster } from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';

// Canonical USDC Address on Arc Testnet
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;

// ABIs
const TREASURY_ABI = [
  {
    type: "function",
    name: "createEvent",
    inputs: [
      { name: "eventId", type: "bytes32" },
      { name: "ticketPriceUSDC", type: "uint256" },
      { name: "organizer", type: "address" },
      { name: "eventEndTime", type: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "deposit",
    inputs: [{ name: "eventId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "checkIn",
    inputs: [
      { name: "eventId", type: "bytes32" },
      { name: "attendee", type: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getEvent",
    inputs: [{ name: "eventId", type: "bytes32" }],
    outputs: [
      { name: "ticketPriceUSDC", type: "uint256" },
      { name: "organizer", type: "address" },
      { name: "eventEndTime", type: "uint256" },
      { name: "settled", type: "bool" },
      { name: "totalBalance", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getDepositStatus",
    inputs: [
      { name: "eventId", type: "bytes32" },
      { name: "attendee", type: "address" }
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getCheckInStatus",
    inputs: [
      { name: "eventId", type: "bytes32" },
      { name: "attendee", type: "address" }
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getRefundStatus",
    inputs: [
      { name: "eventId", type: "bytes32" },
      { name: "attendee", type: "address" }
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view"
  }
] as const;

const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  }
] as const;

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  ticket_price: number;
  organizer: string;
  end_time: number;
  created_at: string;
}

interface AgentDecision {
  id: string;
  event_id: string;
  trigger_type: string;
  target_address: string;
  decision: string;
  reasoning: string;
  tx_hash: string;
  created_at: string;
}

interface InvoiceItem {
  id: string;
  event_id: string;
  vendor_address: string;
  amount: number;
  file_url: string;
  status: string;
  feedback: string;
  created_at: string;
}

interface BadgeItem {
  tokenId: number;
  name: string;
  description: string;
  svg: string;
  attributes: Array<{ trait_type: string; value: string }>;
}

export default function App() {
  const { address: userAddress, isConnected } = useAccount();
  const [currentView, setCurrentView] = useState<'dashboard' | 'events' | 'treasury' | 'audit'>('dashboard');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Address Settings (Persistent in localStorage)
  const [treasuryAddress, setTreasuryAddress] = useState<string>(
    localStorage.getItem("TREASURY_ADDRESS") || import.meta.env.VITE_TREASURY_ADDRESS || ''
  );
  const [attestationAddress, setAttestationAddress] = useState<string>(
    localStorage.getItem("ATTESTATION_ADDRESS") || import.meta.env.VITE_ATTESTATION_ADDRESS || ''
  );

  // DB States
  const [events, setEvents] = useState<EventItem[]>([]);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);

  // Create Event Form
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventPrice, setNewEventPrice] = useState('10');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDurationHours, setNewEventDurationHours] = useState('2');

  // Submit Invoice Form
  const [invoiceAmount, setInvoiceAmount] = useState('5');
  const [invoiceFileUrl, setInvoiceFileUrl] = useState('https://ipfs.io/ipfs/QmInvoicePlaceholderHex');

  // Manual Check-In State
  const [manualAttendeeAddress, setManualAttendeeAddress] = useState('');

  // SBT Badges State
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(false);

  // Save Settings
  const saveSettings = (treasury: string, attestation: string) => {
    setTreasuryAddress(treasury);
    setAttestationAddress(attestation);
    localStorage.setItem("TREASURY_ADDRESS", treasury);
    localStorage.setItem("ATTESTATION_ADDRESS", attestation);
    toast.success("Contract settings updated!");
  };

  // Fetch Database Data
  const fetchData = async () => {
    try {
      const { data: evs } = await supabase.from('events').select('*').order('created_at', { ascending: false });
      if (evs) setEvents(evs);

      const { data: decs } = await supabase.from('agent_decisions').select('*').order('created_at', { ascending: false });
      if (decs) setDecisions(decs);

      const { data: invs } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
      if (invs) setInvoices(invs);

      const { data: rsv } = await supabase.from('rsvps').select('*');
      if (rsv) setRsvps(rsv);
    } catch (err) {
      console.error("Supabase fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to agent decisions in real-time
    const decisionsChannel = supabase
      .channel('realtime-decisions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_decisions' },
        (payload) => {
          setDecisions(prev => [payload.new as AgentDecision, ...prev]);
          toast('🤖 Agent signed a new transaction!', { icon: '🤖' });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(decisionsChannel);
    };
  }, []);

  // Fetch Minted Badges for Gallery
  const fetchBadges = async () => {
    if (!attestationAddress) return;
    setLoadingBadges(true);
    setBadges([]);
    try {
      const { data: rsvpsWithBadges } = await supabase
        .from('agent_decisions')
        .select('reasoning')
        .eq('trigger_type', 'check_in')
        .eq('decision', 'processed');

      const tokenIds: number[] = [];
      rsvpsWithBadges?.forEach(dec => {
        const match = dec.reasoning.match(/Attestation #(\d+)/);
        if (match && match[1]) {
          tokenIds.push(Number(match[1]));
        }
      });

      const badgesList: BadgeItem[] = [];
      const rpcUrl = "https://rpc.testnet.arc.network";

      for (const id of tokenIds) {
        try {
          const body = JSON.stringify({
            jsonrpc: "2.0",
            id: id,
            method: "eth_call",
            params: [
              {
                to: attestationAddress,
                data: "0xc87b56dd" + id.toString(16).padStart(64, '0')
              },
              "latest"
            ]
          });
          const fetchRes = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
          });
          const jsonRes = await fetchRes.json();
          if (jsonRes.result && jsonRes.result !== '0x') {
            const hex = jsonRes.result.substring(130);
            const byteString = hex.match(/.{1,2}/g)?.map((byte: string) => String.fromCharCode(parseInt(byte, 16))).join('');
            const dataUri = byteString?.replace(/\x00/g, '').trim() || "";
            if (dataUri.startsWith("data:application/json;base64,")) {
              const base64 = dataUri.substring("data:application/json;base64,".length);
              const decoded = JSON.parse(atob(base64));
              
              let svg = "";
              if (decoded.image && decoded.image.startsWith("data:image/svg+xml;base64,")) {
                svg = atob(decoded.image.substring("data:image/svg+xml;base64,".length));
              }
              
              badgesList.push({
                tokenId: id,
                name: decoded.name,
                description: decoded.description,
                svg,
                attributes: decoded.attributes
              });
            }
          }
        } catch (err) {
          console.error(`Error loading badge tokenId ${id}:`, err);
        }
      }
      setBadges(badgesList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBadges(false);
    }
  };

  useEffect(() => {
    if (currentView === 'audit') {
      fetchBadges();
    }
  }, [currentView, attestationAddress]);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Contract Reads for Selected Event
  const { data: onChainEvent } = useReadContract({
    address: treasuryAddress as `0x${string}`,
    abi: TREASURY_ABI,
    functionName: 'getEvent',
    args: selectedEventId ? [selectedEventId as `0x${string}`] : undefined,
    query: { enabled: !!selectedEventId && !!treasuryAddress }
  });

  const { data: hasDeposited } = useReadContract({
    address: treasuryAddress as `0x${string}`,
    abi: TREASURY_ABI,
    functionName: 'getDepositStatus',
    args: selectedEventId && userAddress ? [selectedEventId as `0x${string}`, userAddress] : undefined,
    query: { enabled: !!selectedEventId && !!userAddress && !!treasuryAddress }
  });

  const { data: hasCheckedIn } = useReadContract({
    address: treasuryAddress as `0x${string}`,
    abi: TREASURY_ABI,
    functionName: 'getCheckInStatus',
    args: selectedEventId && userAddress ? [selectedEventId as `0x${string}`, userAddress] : undefined,
    query: { enabled: !!selectedEventId && !!userAddress && !!treasuryAddress }
  });

  const { data: hasRefunded } = useReadContract({
    address: treasuryAddress as `0x${string}`,
    abi: TREASURY_ABI,
    functionName: 'getRefundStatus',
    args: selectedEventId && userAddress ? [selectedEventId as `0x${string}`, userAddress] : undefined,
    query: { enabled: !!selectedEventId && !!userAddress && !!treasuryAddress }
  });

  // USDC Allowance read
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress && treasuryAddress ? [userAddress, treasuryAddress as `0x${string}`] : undefined,
    query: { enabled: !!userAddress && !!treasuryAddress }
  });

  // Write contract hook
  const { writeContract } = useWriteContract();

  // Create Event Handler
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treasuryAddress || !userAddress) {
      toast.error("Connect wallet and configure contract settings!");
      return;
    }

    try {
      const id = keccak256(toHex(newEventTitle + Date.now().toString()));
      const price = parseUnits(newEventPrice, 6);
      const endTime = Math.floor(new Date(newEventDate).getTime() / 1000) + (Number(newEventDurationHours) * 3600);

      toast.loading("Deploying escrow event on-chain...", { id: "create" });

      writeContract({
        address: treasuryAddress as `0x${string}`,
        abi: TREASURY_ABI,
        functionName: 'createEvent',
        args: [id as `0x${string}`, price, userAddress, BigInt(endTime)]
      }, {
        onSuccess: async () => {
          toast.success("Event deployed on Arc Testnet!", { id: "create" });
          
          await supabase.from('events').insert({
            id,
            title: newEventTitle,
            description: newEventDesc,
            date: new Date(newEventDate).toISOString(),
            location: newEventLocation,
            ticket_price: Number(newEventPrice),
            organizer: userAddress,
            end_time: endTime
          });
          
          toast.success("Event catalog updated successfully!");
          fetchData();
          setNewEventTitle('');
          setNewEventDesc('');
          setNewEventLocation('');
        },
        onError: (err) => {
          toast.error(`Transaction failed: ${err.message}`, { id: "create" });
        }
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to create event");
    }
  };

  // Deposit Handler
  const handleDeposit = async () => {
    if (!selectedEventId || !treasuryAddress) return;
    const priceAmount = parseUnits(selectedEvent!.ticket_price.toString(), 6);

    if (!usdcAllowance || usdcAllowance < priceAmount) {
      toast.loading("Approving USDC transfer...", { id: "approve" });
      writeContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [treasuryAddress as `0x${string}`, priceAmount]
      }, {
        onSuccess: () => {
          toast.success("USDC transfer approved! Confirm your deposit next.", { id: "approve" });
          refetchAllowance();
        },
        onError: (err) => {
          toast.error(`Approval failed: ${err.message}`, { id: "approve" });
        }
      });
      return;
    }

    toast.loading("Depositing USDC to escrow...", { id: "deposit" });
    writeContract({
      address: treasuryAddress as `0x${string}`,
      abi: TREASURY_ABI,
      functionName: 'deposit',
      args: [selectedEventId as `0x${string}`]
    }, {
      onSuccess: async (hash) => {
        toast.success("Deposit processed successfully!", { id: "deposit" });
        
        await supabase.from('rsvps').insert({
          event_id: selectedEventId,
          attendee: userAddress,
          tx_hash: hash,
          status: 'deposited'
        });

        toast.success("Ticket registered. Your escrow is active!");
        fetchData();
      },
      onError: (err) => {
        toast.error(`Deposit failed: ${err.message}`, { id: "deposit" });
      }
    });
  };

  // Upload Invoice Handler (Vendor)
  const handleUploadInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !userAddress) return;

    try {
      toast.loading("Uploading invoice document...", { id: "invoice" });

      const { error } = await supabase.from('invoices').insert({
        event_id: selectedEventId,
        vendor_address: userAddress,
        amount: Number(invoiceAmount),
        file_url: invoiceFileUrl,
        status: 'pending'
      });

      if (error) throw error;

      toast.success("Invoice uploaded. AI Controller has received it for review!", { id: "invoice" });
      fetchData();
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`, { id: "invoice" });
    }
  };

  // Manual Check-In Staff Handler
  const handleCheckIn = async (attendeeAddr: string) => {
    if (!selectedEventId || !treasuryAddress) return;
    toast.loading(`Signing arrival: ${attendeeAddr}...`, { id: "checkin" });

    writeContract({
      address: treasuryAddress as `0x${string}`,
      abi: TREASURY_ABI,
      functionName: 'checkIn',
      args: [selectedEventId as `0x${string}`, attendeeAddr as `0x${string}`]
    }, {
      onSuccess: async () => {
        toast.success("Check-in receipt written on-chain!", { id: "checkin" });
        
        await supabase
          .from('rsvps')
          .update({ status: 'checked_in', updated_at: new Date().toISOString() })
          .match({ event_id: selectedEventId, attendee: attendeeAddr });

        toast.success("On-chain CheckIn emitted. Autonomous Agent will process the refund shortly!");
        fetchData();
      },
      onError: (err) => {
        toast.error(`Check-in failed: ${err.message}`, { id: "checkin" });
      }
    });
  };

  // Start QR Camera Scanner
  const startScanner = () => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
    scanner.render((decodedText: string) => {
      if (decodedText.startsWith("0x") && decodedText.length === 42) {
        handleCheckIn(decodedText);
        scanner.clear();
      } else {
        toast.error("Invalid QR Code content. Must be an EVM address.");
      }
    }, () => {
      // silent fail
    });
  };

  // Calculate Total utilization
  const totalBalanceSum = events.reduce((sum, ev) => sum + (ev.ticket_price), 0);
  const utilizationPercent = totalBalanceSum > 0 ? Math.min(Math.round((rsvps.length * 50 / totalBalanceSum) * 100), 100) : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e4e1e7] flex flex-col font-body-base antialiased">
      <Toaster position="bottom-right" />
      
      {/* TopAppBar */}
      <header className="bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_20px_rgba(0,240,255,0.1)] fixed top-0 w-full z-50 flex justify-between items-center h-16 px-margin-desktop text-primary">
        <div className="flex items-center gap-4">
          <span className="font-display-lg text-[22px] font-black tracking-tighter text-primary-fixed-dim text-glow-cyan">
            AEGIS WATERFALL
          </span>
          <div className="hidden md:flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-surface-container-low border border-white/5">
            <div className="w-2 h-2 rounded-full bg-primary-container status-dot-active"></div>
            <span className="font-status-sm text-[10px] text-on-surface-variant uppercase tracking-widest">Daemon Active</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => { fetchData(); toast.success("Synced database!"); }}
            className="text-on-surface-variant hover:text-primary transition-colors duration-300 active:scale-95 transition-transform flex items-center justify-center"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>sensors</span>
          </button>
          <ConnectButton />
        </div>
      </header>

      {/* Contract Settings Section */}
      <div className="bg-surface-container-low/90 backdrop-blur border-b border-white/10 py-3 fixed top-16 w-full z-40 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-amber-500 font-medium">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>Configure contract deployments to initiate settlements:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <input 
              type="text" 
              placeholder="Treasury Address" 
              value={treasuryAddress}
              onChange={(e) => setTreasuryAddress(e.target.value)}
              className="bg-surface-container-lowest border border-white/10 rounded px-3 py-1 text-[11px] font-mono text-primary-container focus:outline-none focus:border-primary-container"
            />
            <input 
              type="text" 
              placeholder="Attestation Address" 
              value={attestationAddress}
              onChange={(e) => setAttestationAddress(e.target.value)}
              className="bg-surface-container-lowest border border-white/10 rounded px-3 py-1 text-[11px] font-mono text-secondary focus:outline-none focus:border-secondary"
            />
            <button 
              onClick={() => saveSettings(treasuryAddress, attestationAddress)}
              className="bg-primary-container text-on-primary-fixed hover:brightness-110 font-bold px-4 py-1 rounded transition text-[11px] glow-primary"
            >
              Update Config
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Wrapper */}
      <div className="flex flex-1 pt-28">
        
        {/* SideNavBar */}
        <nav className="hidden md:flex flex-col py-6 gap-2 bg-surface-container-lowest/50 backdrop-blur-md border-r border-white/10 fixed left-0 top-28 h-[calc(100vh-112px)] w-64 z-40 text-primary">
          <div className="px-6 mb-8 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center overflow-hidden">
              <span className="material-symbols-outlined text-2xl text-secondary">smart_toy</span>
            </div>
            <div>
              <h2 className="font-title-md text-sm font-semibold text-on-surface">SYS OP</h2>
              <p className="font-label-mono text-[10px] text-primary-fixed-dim uppercase tracking-wider">Controller Unit</p>
            </div>
          </div>

          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-4 px-6 py-3 text-left w-full transition-all duration-200 font-label-mono text-sm border-r-2 ${
              currentView === 'dashboard' ? 'text-primary border-primary-container bg-primary/5' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </button>

          <button 
            onClick={() => { setCurrentView('events'); setSelectedEventId(null); }}
            className={`flex items-center gap-4 px-6 py-3 text-left w-full transition-all duration-200 font-label-mono text-sm border-r-2 ${
              currentView === 'events' ? 'text-primary border-primary-container bg-primary/5' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">event_note</span>
            Event Escrows
          </button>

          <button 
            onClick={() => setCurrentView('treasury')}
            className={`flex items-center gap-4 px-6 py-3 text-left w-full transition-all duration-200 font-label-mono text-sm border-r-2 ${
              currentView === 'treasury' ? 'text-primary border-primary-container bg-primary/5' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">account_balance_wallet</span>
            Payout Settlements
          </button>

          <button 
            onClick={() => setCurrentView('audit')}
            className={`flex items-center gap-4 px-6 py-3 text-left w-full transition-all duration-200 font-label-mono text-sm border-r-2 ${
              currentView === 'audit' ? 'text-primary border-primary-container bg-primary/5' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">security</span>
            SBT Badges
          </button>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 ml-0 md:ml-64 p-6 md:p-10 pt-4 overflow-y-auto max-w-7xl w-full">
          
          <div className="mb-8">
            <h1 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface">
              {currentView === 'dashboard' && "Mission Control"}
              {currentView === 'events' && "Event Escrows"}
              {currentView === 'treasury' && "Treasury Settlements"}
              {currentView === 'audit' && "Badge Gallery & Audits"}
            </h1>
            <p className="font-label-mono text-xs text-on-surface-variant mt-2 uppercase tracking-wider">
              SYS.OP &gt; {currentView.toUpperCase()} VIEW
            </p>
          </div>

          {/* VIEW: DASHBOARD */}
          {currentView === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Treasury Card */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-container to-secondary-container"></div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-title-md text-sm font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary-fixed-dim">account_balance</span>
                      Treasury Overview
                    </h3>
                  </div>
                  <div className="mt-4 mb-2">
                    <p className="font-label-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">On-chain Escrow Balance</p>
                    <div className="flex items-end gap-2">
                      <span className="font-display-lg text-4xl font-extrabold text-primary-fixed-dim text-glow-cyan">
                        {events.length > 0 ? (events.length * 50).toFixed(2) : "0.00"}
                      </span>
                      <span className="font-title-md text-sm text-on-surface-variant mb-1">USDC</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between font-status-sm text-xs text-on-surface-variant mb-2">
                      <span>RSVP Escrow Utilization</span>
                      <span>{utilizationPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#BC13FE] to-[#00F0FF] transition-all duration-500" 
                        style={{ width: `${utilizationPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Audit Queue */}
                <div className="glass-panel rounded-xl p-6 cyber-border-primary">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-title-md text-sm font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">receipt_long</span>
                      Audit Queue
                    </h3>
                    <div className="w-2 h-2 rounded-full bg-cyan-400 status-dot-active"></div>
                  </div>
                  <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1 terminal-scroll">
                    {invoices.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">No vendor invoices in audit.</p>
                    ) : (
                      invoices.map((inv) => (
                        <div key={inv.id} className="bg-surface-container/50 border border-white/5 rounded-lg p-4 hover:border-primary-container/30 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-surface-container-high rounded border border-white/10 text-on-surface-variant flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                              </div>
                              <div>
                                <p className="font-label-mono text-xs text-on-surface truncate w-32">{inv.file_url.split('/').pop() || "invoice.pdf"}</p>
                                <p className="font-status-sm text-[10px] text-on-surface-variant mt-0.5">Vendor Payout</p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              inv.status === 'paid' ? 'bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/20' :
                              inv.status === 'approved' ? 'bg-primary-container/10 text-primary-fixed-dim border border-primary-container/20' :
                              inv.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-surface-variant text-slate-400 border border-white/10'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                          {inv.feedback && (
                            <div className="mt-3 pt-3 border-t border-white/5 font-label-mono text-[10px] text-on-surface-variant">
                              <span className="text-secondary opacity-80">&gt; LLM_Note:</span> {inv.feedback}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Middle Column (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* AI Agent Live Logs */}
                <div className="glass-panel rounded-xl cyber-border-secondary flex flex-col h-[350px]">
                  <div className="bg-surface-container-lowest border-b border-secondary/30 p-3 flex justify-between items-center rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-sm">terminal</span>
                      <span className="font-label-mono text-xs text-secondary font-bold">AI Agent Live Logs</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-surface-variant"></div>
                      <div className="w-2 h-2 rounded-full bg-surface-variant"></div>
                      <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    </div>
                  </div>
                  <div className="flex-1 p-4 bg-[#050505] rounded-b-xl overflow-y-auto terminal-scroll font-label-mono text-xs leading-relaxed text-slate-300">
                    <div className="mb-2 text-on-surface-variant opacity-60">
                      <span className="text-secondary">[12:00:01]</span> SYS: Initialize Aegis Waterfall Daemon... OK.
                    </div>
                    <div className="mb-2 text-on-surface-variant opacity-60">
                      <span className="text-secondary">[12:00:05]</span> SYS: Scan on-chain events on Arc Testnet... OK.
                    </div>
                    {decisions.slice(0, 10).map((dec) => (
                      <div key={dec.id} className="mb-3">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                          <span>[{new Date(dec.created_at).toLocaleTimeString()}]</span>
                          <span>{dec.trigger_type.toUpperCase()}</span>
                        </div>
                        <p className="text-on-surface">
                          <span className="text-secondary">🤖 Agent Triggered:</span> {dec.reasoning}
                        </p>
                        {dec.tx_hash && (
                          <p className="text-primary-fixed-dim font-mono text-[10px] truncate">
                            &gt; Confirmed Tx: {dec.tx_hash}
                          </p>
                        )}
                      </div>
                    ))}
                    <div className="text-secondary animate-pulse mt-4">&gt; Awaiting events... _</div>
                  </div>
                </div>

                {/* QR Gatekeeper Scanner */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group border border-white/5">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary-container/10 blur-xl"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="font-title-md text-sm font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary-fixed-dim">qr_code_scanner</span>
                      Gatekeeper Scanner
                    </h3>
                    <div className="flex items-center gap-2 bg-surface-container-lowest px-2.5 py-0.5 rounded border border-white/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-error status-dot-active" style={{ animationName: "pulse-red" }}></div>
                      <span className="font-status-sm text-[10px] text-on-surface-variant uppercase">Scanner Live</span>
                    </div>
                  </div>

                  <div className="relative w-full aspect-video bg-surface-container-lowest rounded-lg border border-white/10 overflow-hidden mt-4">
                    <div className="absolute inset-0 bg-[#0A0A0A] bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary-container"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary-container"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary-container"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary-container"></div>
                    <div className="scanline"></div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-24 h-24 border border-white/20 flex items-center justify-center">
                        <span className="font-label-mono text-[9px] text-on-surface-variant/40 text-center uppercase">Scan<br/>Ticket</span>
                      </div>
                    </div>
                    <div id="reader" className="absolute inset-0 w-full h-full opacity-80"></div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex gap-2">
                      <select 
                        onChange={(e) => setSelectedEventId(e.target.value)} 
                        value={selectedEventId || ''}
                        className="flex-1 bg-surface-container-lowest border border-white/10 rounded px-2 py-1.5 text-xs text-on-surface focus:outline-none"
                      >
                        <option value="">-- Select Active Event --</option>
                        {events.map(ev => (
                          <option key={ev.id} value={ev.id}>{ev.title}</option>
                        ))}
                      </select>
                      <button 
                        onClick={startScanner} 
                        disabled={!selectedEventId}
                        className="bg-primary-container text-on-primary-fixed hover:brightness-110 disabled:brightness-50 px-3 rounded font-bold text-xs glow-primary shrink-0"
                      >
                        Start Cam
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Or input Address manually (0x...)" 
                        value={manualAttendeeAddress}
                        onChange={(e) => setManualAttendeeAddress(e.target.value)}
                        className="flex-1 bg-surface-container-lowest border border-white/10 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-primary-container"
                      />
                      <button 
                        onClick={() => handleCheckIn(manualAttendeeAddress)}
                        disabled={!selectedEventId || !manualAttendeeAddress.startsWith("0x")}
                        className="bg-surface-container-high border border-white/10 text-white hover:bg-white/5 disabled:opacity-40 px-3 py-1.5 rounded font-bold text-xs"
                      >
                        Check In
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Create Event Admin Control */}
                <div className="glass-panel rounded-xl p-6 border border-white/10 relative">
                  <h3 className="font-title-md text-sm font-semibold text-on-surface flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-secondary">add_box</span>
                    Deploy Escrow Event
                  </h3>
                  
                  <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase">Event Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. ETHGlobal Neo-Tokyo" 
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-white/10 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-primary-container"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase">Description</label>
                      <textarea 
                        placeholder="Escrow parameters and venue info..." 
                        value={newEventDesc}
                        onChange={(e) => setNewEventDesc(e.target.value)}
                        rows={2}
                        className="w-full bg-surface-container-lowest border border-white/10 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-primary-container"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase">Deposit (USDC)</label>
                        <input 
                          type="number" 
                          placeholder="50" 
                          value={newEventPrice}
                          onChange={(e) => setNewEventPrice(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-white/10 rounded px-3 py-2 text-slate-200 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase">Hours Duration</label>
                        <input 
                          type="number" 
                          placeholder="2" 
                          value={newEventDurationHours}
                          onChange={(e) => setNewEventDurationHours(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-white/10 rounded px-3 py-2 text-slate-200 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase">Start Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-white/10 rounded px-3 py-2 text-slate-400 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase">Location</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Roppongi Hills, Tokyo" 
                        value={newEventLocation}
                        onChange={(e) => setNewEventLocation(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-white/10 rounded px-3 py-2 text-slate-200 focus:outline-none"
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full mt-3 bg-gradient-to-r from-primary-container to-secondary-container text-on-primary-fixed hover:brightness-110 font-bold py-2.5 rounded transition glow-primary"
                    >
                      Deploy Escrow
                    </button>
                  </form>
                </div>

              </div>

            </div>
          )}

          {/* VIEW: EVENTS CATALOG */}
          {currentView === 'events' && (
            <div>
              {selectedEventId && selectedEvent ? (
                <div>
                  <button 
                    onClick={() => setSelectedEventId(null)}
                    className="text-xs text-slate-400 hover:text-white mb-6 flex items-center gap-1 font-semibold"
                  >
                    &larr; Back to Catalog
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Event Escrow details */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="glass-panel border border-white/10 rounded-xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-44 h-44 bg-primary-container/5 rounded-full blur-3xl"></div>
                        
                        <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                          <div>
                            <h2 className="text-2xl font-extrabold text-white">{selectedEvent.title}</h2>
                            <p className="text-slate-400 mt-2 text-sm">{selectedEvent.description}</p>
                          </div>
                          <div className="p-4 bg-surface-container-lowest rounded-xl border border-white/5 text-right">
                            <p className="text-[9px] text-slate-500 font-bold tracking-wider uppercase">USDC ESCROW DEPOSIT</p>
                            <p className="text-xl font-black text-primary-fixed-dim mt-1">{selectedEvent.ticket_price} USDC</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 border-y border-white/10 text-xs text-slate-300">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">calendar_today</span>
                            <div>
                              <p className="text-slate-500 text-[9px] font-bold">DATE</p>
                              <p>{new Date(selectedEvent.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary-fixed-dim">location_on</span>
                            <div>
                              <p className="text-slate-500 text-[9px] font-bold">LOCATION</p>
                              <p>{selectedEvent.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary-fixed-dim">timer</span>
                            <div>
                              <p className="text-slate-500 text-[9px] font-bold">EXPIRES</p>
                              <p>{new Date(selectedEvent.end_time * 1000).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-container-lowest/80 p-4 rounded-xl border border-white/5">
                          <div className="text-[11px] text-slate-400">
                            <p className="font-bold text-slate-300">Organizer Address</p>
                            <p className="font-mono mt-0.5">{selectedEvent.organizer}</p>
                          </div>
                          <div className="text-[11px] text-slate-400 text-right">
                            <p className="font-bold text-slate-300">On-Chain Escrow Balance</p>
                            <p className="font-mono text-primary-container font-extrabold mt-0.5">
                              {onChainEvent ? formatUnits(onChainEvent[4], 6) : "0.00"} USDC
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* RSVP and attendee list */}
                      <div className="glass-panel border border-white/10 rounded-xl p-6">
                        <h3 className="text-sm font-bold mb-4">Event RSVPs & Escrow Statuses</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold">
                                <th className="py-3">Attendee Wallet</th>
                                <th className="py-3 text-center">Escrow Value</th>
                                <th className="py-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rsvps.filter(r => r.event_id === selectedEventId).length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="py-6 text-center text-slate-500">No RSVPs detected for this event escrow.</td>
                                </tr>
                              ) : (
                                rsvps.filter(r => r.event_id === selectedEventId).map((rsvp, idx) => (
                                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3 font-mono">{rsvp.attendee}</td>
                                    <td className="py-3 text-center text-cyan-400 font-semibold">{selectedEvent.ticket_price} USDC</td>
                                    <td className="py-3 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                        rsvp.status === 'refunded' ? 'bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/20' :
                                        rsvp.status === 'checked_in' ? 'bg-amber-900/20 text-amber-400 border border-amber-800/30' :
                                        'bg-primary-container/10 text-primary-fixed-dim border border-primary-container/20'
                                      }`}>
                                        {rsvp.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Ticket deposit side panels */}
                    <div className="space-y-6">
                      
                      {/* Ticket RSVP Card */}
                      <div className="glass-panel border border-white/10 rounded-xl p-6 relative overflow-hidden">
                        <h3 className="font-title-md text-sm font-semibold mb-2 flex items-center gap-2 text-primary-fixed-dim">
                          <span className="material-symbols-outlined">qr_code_scanner</span>
                          Deposit Ticket Escrow
                        </h3>
                        <p className="text-[11px] text-slate-400 mb-6">Escrow the ticket fee in USDC. The autonomous agent will automatically issue a refund directly back to your address the second you check in.</p>

                        {!isConnected ? (
                          <div className="p-4 bg-surface-container-lowest rounded-xl border border-white/5 text-center">
                            <p className="text-xs text-slate-400 mb-3">Connect wallet to deposit escrow</p>
                            <ConnectButton />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {hasRefunded ? (
                              <div className="p-4 bg-[#00ff9d]/10 border border-[#00ff9d]/20 rounded-xl text-center">
                                <span className="material-symbols-outlined text-3xl text-[#00ff9d] mb-2">task_alt</span>
                                <h4 className="font-bold text-[#00ff9d] text-sm">Escrow Refunded</h4>
                                <p className="text-[10px] text-[#00ff9d]/70 mt-1">Arrival verified. Autonomous refund processed instantly on-chain.</p>
                              </div>
                            ) : hasCheckedIn ? (
                              <div className="p-4 bg-amber-950/20 border border-amber-800/30 rounded-xl text-center">
                                <span className="material-symbols-outlined text-3xl text-amber-400 mb-2">autorenew</span>
                                <h4 className="font-bold text-amber-400 text-sm">Arrival Confirmed</h4>
                                <p className="text-[10px] text-amber-500 mt-1">Daemon is executing the refund and SBT attestation minting...</p>
                              </div>
                            ) : hasDeposited ? (
                              <div className="p-4 bg-surface-container-lowest rounded-xl border border-white/5 text-center space-y-3">
                                <div className="inline-block p-2 bg-primary-container/10 border border-primary-container/20 rounded-full text-primary-container">
                                  <span className="material-symbols-outlined text-xl">qr_code</span>
                                </div>
                                <h4 className="font-bold text-white text-sm">Escrow Locked</h4>
                                <p className="text-[10px] text-slate-400">Scan this wallet address QR code at the event gate to check in:</p>
                                <div className="bg-white p-3 rounded-lg inline-block shadow-md">
                                  <svg className="w-28 h-28 text-slate-950" viewBox="0 0 100 100">
                                    <rect width="20" height="20" fill="currentColor"/>
                                    <rect x="80" width="20" height="20" fill="currentColor"/>
                                    <rect y="80" width="20" height="20" fill="currentColor"/>
                                    <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="6"/>
                                    <rect x="35" y="35" width="30" height="30" fill="currentColor"/>
                                    <rect x="40" y="80" width="20" height="20" fill="currentColor"/>
                                    <rect x="80" y="40" width="20" height="20" fill="currentColor"/>
                                  </svg>
                                </div>
                                <p className="text-[9px] font-mono text-slate-400 truncate mt-1">{userAddress}</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="p-3 bg-surface-container-lowest border border-white/5 rounded-xl text-center text-xs">
                                  <span className="text-slate-400">Required: </span>
                                  <span className="text-white font-bold">{selectedEvent.ticket_price} USDC</span>
                                </div>
                                <button 
                                  onClick={handleDeposit}
                                  className="w-full bg-gradient-to-r from-primary-container to-secondary-container text-on-primary-fixed font-bold py-3 rounded-xl transition text-xs shadow-lg glow-primary"
                                >
                                  {!usdcAllowance || usdcAllowance < parseUnits(selectedEvent.ticket_price.toString(), 6) 
                                    ? "Approve USDC Escrow" 
                                    : "Lock Escrow & RSVP"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Request Vendor Payout Card */}
                      <div className="glass-panel border border-white/10 rounded-xl p-6">
                        <h3 className="font-title-md text-sm font-semibold mb-2 flex items-center gap-2 text-secondary">
                          <span className="material-symbols-outlined">description</span>
                          Request Vendor Payout
                        </h3>
                        <p className="text-[11px] text-slate-400 mb-6">Submit your vendor invoice. The AI agent will review it against the rubric and queue it for payout.</p>

                        {!isConnected ? (
                          <p className="text-xs text-slate-500 text-center py-4">Connect wallet to request payout</p>
                        ) : (
                          <form onSubmit={handleUploadInvoice} className="space-y-4">
                            <div>
                              <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase">Requested Payout (USDC)</label>
                              <input 
                                type="number" 
                                placeholder="Amount" 
                                value={invoiceAmount}
                                onChange={(e) => setInvoiceAmount(e.target.value)}
                                className="w-full bg-surface-container-lowest border border-white/10 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 font-bold mb-1 tracking-wider uppercase">Invoice Document URL</label>
                              <input 
                                type="text" 
                                placeholder="File URL" 
                                value={invoiceFileUrl}
                                onChange={(e) => setInvoiceFileUrl(e.target.value)}
                                className="w-full bg-surface-container-lowest border border-white/10 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                              />
                            </div>
                            <button 
                              type="submit"
                              className="w-full bg-surface-container-high border border-white/10 text-white hover:bg-white/5 font-bold py-2.5 rounded-lg transition text-xs"
                            >
                              Submit Payout Request
                            </button>
                          </form>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((ev) => (
                      <div key={ev.id} className="glass-panel rounded-xl p-1 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-container via-surface-container to-secondary-container opacity-20"></div>
                        <div className="bg-surface-dim relative z-10 rounded-lg p-5 h-full flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="px-2.5 py-0.5 bg-surface-container-high text-on-surface border border-white/10 rounded font-status-sm text-[10px] uppercase tracking-wider flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-primary-fixed-dim">calendar_today</span>
                                Active Escrow
                              </span>
                              <span className="font-label-mono text-xs text-primary-fixed-dim font-bold">{ev.ticket_price} USDC</span>
                            </div>
                            <h3 className="font-title-md text-base text-on-surface mb-2 font-bold">{ev.title}</h3>
                            <p className="text-slate-400 text-xs line-clamp-3 mb-6 leading-relaxed">{ev.description}</p>
                          </div>
                          
                          <div className="space-y-2.5 pt-4 border-t border-white/5 text-[11px] text-slate-400">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-slate-500">pin_drop</span>
                              <span>{ev.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-slate-500">schedule</span>
                              <span>Ends {new Date(ev.end_time * 1000).toLocaleTimeString()}</span>
                            </div>
                            <button 
                              onClick={() => setSelectedEventId(ev.id)}
                              className="w-full mt-4 bg-transparent border border-primary-container text-primary-fixed-dim hover:bg-primary-container/10 px-4 py-2 rounded font-bold text-xs transition-all flex justify-center items-center gap-2"
                            >
                              Open Escrow Portal
                              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {events.length === 0 && (
                    <div className="text-center py-20 bg-surface-container-lowest border border-white/5 rounded-xl">
                      <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">event_busy</span>
                      <h3 className="text-base font-bold text-slate-400">No escrows deployed yet</h3>
                      <p className="text-slate-500 text-xs mt-1">Deploy the first escrow event in the Dashboard panel.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW: PAYOUT SETTLEMENTS */}
          {currentView === 'treasury' && (
            <div className="space-y-6">
              <div className="glass-panel border border-white/10 rounded-xl p-6">
                <h3 className="font-title-md text-base font-semibold text-white mb-4">Ended Events Awaiting Payout Settlements</h3>
                <p className="text-xs text-slate-400 mb-6">Below is the queue of events whose end times have passed. The AI agent will autonomously trigger payouts to vendors and organizers.</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="py-3">Event Title</th>
                        <th className="py-3">Organizer</th>
                        <th className="py-3 text-center">EndTime</th>
                        <th className="py-3 text-center">Treasury Balance</th>
                        <th className="py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.filter(ev => Math.floor(Date.now() / 1000) > ev.end_time).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500">No expired event escrows detected.</td>
                        </tr>
                      ) : (
                        events.filter(ev => Math.floor(Date.now() / 1000) > ev.end_time).map((ev) => {
                          const hasBalance = rsvps.filter(r => r.event_id === ev.id && r.status === 'deposited').length > 0;
                          return (
                            <tr key={ev.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="py-3 font-semibold text-white">{ev.title}</td>
                              <td className="py-3 font-mono">{ev.organizer.substring(0, 12)}...</td>
                              <td className="py-3 text-center">{new Date(ev.end_time * 1000).toLocaleString()}</td>
                              <td className="py-3 text-center text-cyan-400 font-semibold">{ev.ticket_price} USDC</td>
                              <td className="py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  !hasBalance ? 'bg-slate-800 text-slate-400 border border-white/10' :
                                  'bg-pink-950/20 text-pink-400 border border-pink-800/30'
                                }`}>
                                  {hasBalance ? "Pending Settle" : "Settled"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SBT BADGE GALLERY */}
          {currentView === 'audit' && (
            <div className="space-y-6">
              {!attestationAddress ? (
                <div className="text-center py-20 bg-surface-container-lowest border border-white/5 rounded-xl">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">workspace_premium</span>
                  <h3 className="text-base font-bold text-slate-400">Settings Configuration Required</h3>
                  <p className="text-slate-500 text-xs mt-1">Configure the Attestation Contract Address in the header bar to browse attendee badges.</p>
                </div>
              ) : loadingBadges ? (
                <div className="text-center py-20">
                  <span className="material-symbols-outlined text-4xl text-cyan-500 animate-spin mb-4">sync</span>
                  <p className="text-slate-400 text-xs">Querying blockchain attestation logs...</p>
                </div>
              ) : badges.length === 0 ? (
                <div className="text-center py-20 bg-surface-container-lowest border border-white/5 rounded-xl">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">workspace_premium</span>
                  <h3 className="text-base font-bold text-slate-400">No SBT Badges Issued Yet</h3>
                  <p className="text-slate-500 text-xs mt-1">SBTs are autonomously minted by the agent upon attendee check-in.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {badges.map((badge) => (
                    <div key={badge.tokenId} className="bg-surface-container-low border border-white/5 rounded-lg p-4 flex flex-col items-center gap-3 hover:border-secondary/30 transition-all group">
                      <div className="w-24 h-24 rounded-full bg-surface-container-highest border border-secondary/20 flex items-center justify-center p-3 group-hover:glow-secondary transition-all overflow-hidden">
                        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: badge.svg }} />
                      </div>
                      <div className="text-center w-full">
                        <h4 className="font-label-mono text-xs font-bold text-on-surface truncate">{badge.name}</h4>
                        <p className="font-status-sm text-[10px] text-on-surface-variant opacity-70 mt-1">SBT #{badge.tokenId}</p>
                        
                        <div className="mt-3 pt-3 border-t border-white/5 text-[9px] text-slate-500 text-left space-y-1">
                          {badge.attributes.map((attr, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span>{attr.trait_type}:</span>
                              <span className="font-mono text-white truncate max-w-[100px]">{attr.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0e0e12]/80 backdrop-blur py-5 text-center text-[10px] text-slate-500 mt-auto">
        <p>&copy; 2026 Aegis Waterfall. Built for Encode x Arc "Programmable Money Hackathon". Deployed on Arc Testnet.</p>
      </footer>
    </div>
  );
}
