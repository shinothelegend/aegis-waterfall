import { useState, useEffect, useRef } from 'react';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract 
} from 'wagmi';
import { parseUnits, keccak256, toHex } from 'viem';
import { supabase } from './supabase';
import toast, { Toaster } from 'react-hot-toast';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { Treasury } from './pages/Treasury';
import { Audit } from './pages/Audit';
import { LandingPage } from './pages/LandingPage';
import { useCheckpointData } from './hooks/useCheckpointData';
import type { BadgeItem } from './hooks/useCheckpointData';
import { SBTRevealModal } from './components/SBTRevealModal';

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
    inputs: [{ name: "account", type: "account" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  }
] as const;

type ViewType = 'landing' | 'dashboard' | 'events' | 'treasury' | 'audit';

export default function App() {
  const { address: userAddress, isConnected } = useAccount();
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Address Settings (Persistent in localStorage)
  const [treasuryAddress, setTreasuryAddress] = useState<string>(
    localStorage.getItem("TREASURY_ADDRESS") || import.meta.env.VITE_TREASURY_ADDRESS || ''
  );
  const [attestationAddress, setAttestationAddress] = useState<string>(
    localStorage.getItem("ATTESTATION_ADDRESS") || import.meta.env.VITE_ATTESTATION_ADDRESS || ''
  );

  // SBT Reveal Modal State
  const [revealBadge, setRevealBadge] = useState<BadgeItem | null>(null);
  const [revealTxHash, setRevealTxHash] = useState<string | undefined>(undefined);
  const [isRevealOpen, setIsRevealOpen] = useState(false);

  // Callback ref for real-time SBT mints
  const sbtHandlerRef = useRef<(tokenId: number, txHash: string) => void>(() => {});

  // Custom hook to query and sync Supabase data
  const {
    events,
    decisions,
    invoices,
    rsvps,
    badges,
    loadingBadges,
    loadingData,
    fetchData,
    fetchBadges,
    fetchSingleBadge,
  } = useCheckpointData({
    attestationAddress,
    onSBTMinited: (tokenId, txHash) => sbtHandlerRef.current(tokenId, txHash)
  });

  // Set the SBT mint callback
  useEffect(() => {
    sbtHandlerRef.current = async (tokenId: number, txHash: string) => {
      toast.loading("Fetching on-chain attestation metadata...", { id: "realtime-sbt" });
      const badge = await fetchSingleBadge(tokenId);
      if (badge) {
        setRevealBadge(badge);
        setRevealTxHash(txHash);
        setIsRevealOpen(true);
        toast.success("Autonomous check-in attestation SBT minted!", { id: "realtime-sbt" });
      } else {
        toast.dismiss("realtime-sbt");
      }
    };
  }, [fetchSingleBadge]);

  // Click handler to inspect a badge from the gallery
  const handleSelectBadge = (badge: BadgeItem) => {
    // Match against decisions to find the corresponding refund transaction hash
    const matchingDec = decisions.find(d => 
      d.trigger_type === 'check_in' && 
      d.decision === 'processed' && 
      d.reasoning.includes(`Attestation #${badge.tokenId}`)
    );
    setRevealBadge(badge);
    setRevealTxHash(matchingDec?.tx_hash);
    setIsRevealOpen(true);
  };

  // Save Settings
  const saveSettings = (treasury: string, attestation: string) => {
    setTreasuryAddress(treasury);
    setAttestationAddress(attestation);
    localStorage.setItem("TREASURY_ADDRESS", treasury);
    localStorage.setItem("ATTESTATION_ADDRESS", attestation);
    toast.success("Contract settings updated!");
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
  const handleCreateEvent = async (
    title: string,
    desc: string,
    price: string,
    date: string,
    location: string,
    durationHours: string
  ) => {
    if (!treasuryAddress || !userAddress) {
      toast.error("Connect wallet and configure contract settings!");
      return;
    }

    try {
      const id = keccak256(toHex(title + Date.now().toString()));
      const priceVal = parseUnits(price, 6);
      const endTime = Math.floor(new Date(date).getTime() / 1000) + (Number(durationHours) * 3600);

      toast.loading("Deploying escrow event on-chain...", { id: "create" });

      writeContract({
        address: treasuryAddress as `0x${string}`,
        abi: TREASURY_ABI,
        functionName: 'createEvent',
        args: [id as `0x${string}`, priceVal, userAddress, BigInt(endTime)]
      }, {
        onSuccess: async () => {
          toast.success("Event deployed on Arc Testnet!", { id: "create" });
          
          await supabase.from('events').insert({
            id,
            title,
            description: desc,
            date: new Date(date).toISOString(),
            location,
            ticket_price: Number(price),
            organizer: userAddress,
            end_time: endTime
          });
          
          toast.success("Event catalog updated successfully!");
          fetchData();
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
    if (!selectedEventId || !treasuryAddress || !selectedEvent) return;
    const priceAmount = parseUnits(selectedEvent.ticket_price.toString(), 6);

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
  const handleUploadInvoice = async (amount: string, fileUrl: string) => {
    if (!selectedEventId || !userAddress) return;

    try {
      toast.loading("Uploading invoice document...", { id: "invoice" });

      const { error } = await supabase.from('invoices').insert({
        event_id: selectedEventId,
        vendor_address: userAddress,
        amount: Number(amount),
        file_url: fileUrl,
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

  if (currentView === 'landing') {
    return (
      <LandingPage 
        onLaunchApp={() => setCurrentView('dashboard')}
        isConnected={isConnected}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-[#cbd5e1] flex flex-col font-mono antialiased">
      <Toaster position="bottom-right" />
      
      {/* Navbar */}
      <Navbar onSync={fetchData} onNavigateToLanding={() => setCurrentView('landing')} />

      {/* Contract Settings Section */}
      <div className="bg-[#050814]/95 backdrop-blur border-b border-white/5 py-3 fixed top-16 w-full z-40 text-xs">
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
              className="bg-[#03050a] border border-white/10 rounded px-3 py-1 text-[11px] font-mono text-cyan-400 focus:outline-none focus:border-cyan-400"
            />
            <input 
              type="text" 
              placeholder="Attestation Address" 
              value={attestationAddress}
              onChange={(e) => setAttestationAddress(e.target.value)}
              className="bg-[#03050a] border border-white/10 rounded px-3 py-1 text-[11px] font-mono text-purple-400 focus:outline-none focus:border-purple-400"
            />
            <button 
              onClick={() => saveSettings(treasuryAddress, attestationAddress)}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-1 rounded transition text-[11px] active:scale-95"
            >
              Update Config
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Wrapper */}
      <div className="flex flex-1 pt-28">
        
        {/* Sidebar */}
        <Sidebar currentView={currentView} onChangeView={setCurrentView} />

        {/* Main Content Area */}
        <main className="flex-1 ml-0 md:ml-64 p-6 md:p-10 pt-4 overflow-y-auto max-w-7xl w-full">
          
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-display">
              {currentView === 'dashboard' && "Mission Control"}
              {currentView === 'events' && "Event Escrows"}
              {currentView === 'treasury' && "Treasury Settlements"}
              {currentView === 'audit' && "Badge Gallery & Audits"}
            </h1>
            <p className="text-xs text-slate-500 mt-2 uppercase tracking-wider font-mono">
              SYS.OP &gt; {currentView.toUpperCase()} VIEW
            </p>
          </div>

          {/* VIEW: DASHBOARD */}
          {currentView === 'dashboard' && (
            <div className="animate-fade-in-up">
              <Dashboard
                events={events}
                decisions={decisions}
                invoices={invoices}
                rsvps={rsvps}
                selectedEventId={selectedEventId}
                manualAttendeeAddress=""
                onSelectEvent={setSelectedEventId}
                onCheckIn={handleCheckIn}
                onCreateEvent={handleCreateEvent}
                userAddress={userAddress}
                loading={loadingData}
              />
            </div>
          )}

          {/* VIEW: EVENTS CATALOG */}
          {currentView === 'events' && (
            <div className="animate-fade-in-up">
              <Events
                events={events}
                selectedEventId={selectedEventId}
                onSelectEvent={setSelectedEventId}
                isConnected={isConnected}
                userAddress={userAddress}
                onChainEvent={onChainEvent}
                hasDeposited={!!hasDeposited}
                hasCheckedIn={!!hasCheckedIn}
                hasRefunded={!!hasRefunded}
                usdcAllowance={usdcAllowance}
                rsvps={rsvps}
                onDeposit={handleDeposit}
                onUploadInvoice={handleUploadInvoice}
              />
            </div>
          )}

          {/* VIEW: PAYOUT SETTLEMENTS */}
          {currentView === 'treasury' && (
            <div className="animate-fade-in-up">
              <Treasury events={events} rsvps={rsvps} />
            </div>
          )}

          {/* VIEW: SBT BADGE GALLERY */}
          {currentView === 'audit' && (
            <div className="animate-fade-in-up">
              <Audit 
                attestationAddress={attestationAddress} 
                loadingBadges={loadingBadges} 
                badges={badges} 
                onSelectBadge={handleSelectBadge}
              />
            </div>
          )}

        </main>
      </div>

      {/* Global Attestation reveal modal overlay */}
      <SBTRevealModal 
        badge={revealBadge}
        isOpen={isRevealOpen}
        onClose={() => setIsRevealOpen(false)}
        refundTxHash={revealTxHash}
      />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050814]/80 backdrop-blur py-5 text-center text-[10px] text-slate-500 mt-auto">
        <p>&copy; 2026 Aegis Waterfall. Built for Encode x Arc "Programmable Money Hackathon". Deployed on Arc Testnet.</p>
      </footer>
    </div>
  );
}
