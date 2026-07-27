import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase.js';
import toast from 'react-hot-toast';

export interface EventItem {
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

export interface AgentDecision {
  id: string;
  event_id: string;
  trigger_type: string;
  target_address: string;
  decision: string;
  reasoning: string;
  tx_hash: string;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  event_id: string;
  vendor_address: string;
  amount: number;
  file_url: string;
  status: string;
  feedback: string;
  created_at: string;
}

export interface BadgeItem {
  tokenId: number;
  name: string;
  description: string;
  svg: string;
  attributes: Array<{ trait_type: string; value: string }>;
}

interface CheckpointDataOptions {
  attestationAddress: string;
  onSBTMinited?: (tokenId: number, txHash: string) => void;
}

export function useCheckpointData({ attestationAddress, onSBTMinited }: CheckpointDataOptions) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Store options in a ref to avoid infinite re-triggering of useEffect
  const optionsRef = useRef({ attestationAddress, onSBTMinited });
  useEffect(() => {
    optionsRef.current = { attestationAddress, onSBTMinited };
  }, [attestationAddress, onSBTMinited]);

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
    } finally {
      setLoadingData(false);
    }
  };

  const fetchSingleBadge = async (tokenId: number): Promise<BadgeItem | null> => {
    const addr = optionsRef.current.attestationAddress;
    if (!addr) return null;
    try {
      const rpcUrl = "https://rpc.testnet.arc.network";
      const body = JSON.stringify({
        jsonrpc: "2.0",
        id: tokenId,
        method: "eth_call",
        params: [
          {
            to: addr,
            data: "0xc87b56dd" + tokenId.toString(16).padStart(64, '0')
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
          
          return {
            tokenId,
            name: decoded.name,
            description: decoded.description,
            svg,
            attributes: decoded.attributes
          };
        }
      }
    } catch (err) {
      console.error(`Error loading single badge ${tokenId}:`, err);
    }
    return null;
  };

  const fetchBadges = async () => {
    const addr = optionsRef.current.attestationAddress;
    if (!addr) return;
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
      for (const id of tokenIds) {
        const badge = await fetchSingleBadge(id);
        if (badge) {
          badgesList.push(badge);
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
    fetchData();

    // Subscribe to all changes on key tables to sync state in real-time
    const decisionsChannel = supabase
      .channel('realtime-decisions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_decisions' },
        (payload) => {
          const dec = payload.new as AgentDecision;
          setDecisions(prev => [dec, ...prev]);
          toast('🤖 Agent processed a new event and signed a transaction!', { icon: '🤖' });

          // If a check-in triggers an attestation badge, notify via callback
          if (dec.trigger_type === 'check_in' && dec.decision === 'processed') {
            const match = dec.reasoning.match(/Attestation #(\d+)/);
            if (match && match[1] && optionsRef.current.onSBTMinited) {
              optionsRef.current.onSBTMinited(Number(match[1]), dec.tx_hash);
            }
          }
        }
      )
      .subscribe();

    const rsvpsChannel = supabase
      .channel('realtime-rsvps')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps' }, () => {
        fetchData();
      })
      .subscribe();

    const invoicesChannel = supabase
      .channel('realtime-invoices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchData();
      })
      .subscribe();

    const eventsChannel = supabase
      .channel('realtime-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(decisionsChannel);
      supabase.removeChannel(rsvpsChannel);
      supabase.removeChannel(invoicesChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, []);

  return {
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
    setEvents,
    setDecisions,
    setInvoices,
    setRsvps
  };
}
