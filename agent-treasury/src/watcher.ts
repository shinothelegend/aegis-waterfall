import { 
  supabase, 
  publicClient, 
  TREASURY_ADDRESS, 
  TREASURY_ABI 
} from "./clients.js";
import { processRefund } from "./refund.js";

interface AgentConfig {
  walletId: string;
  address: string;
}

/**
 * Initializes and starts real-time event watchers for blockchain logs and Supabase RSVP changes.
 */
export function startWatchers(agentConfig: AgentConfig) {
  console.log(`[Agent] Starting on-chain CheckedIn event listener on ${TREASURY_ADDRESS}...`);
  publicClient.watchContractEvent({
    address: TREASURY_ADDRESS,
    abi: TREASURY_ABI,
    eventName: "CheckedIn",
    onLogs: async (logs) => {
      for (const log of logs) {
        const { eventId, attendee } = log.args;
        if (eventId && attendee) {
          console.log(`[Agent] Real-time CheckedIn event detected: EventId=${eventId}, Attendee=${attendee}`);
          
          // Check if already refunded in Supabase first to prevent duplicate trigger
          const { data: rsvps } = await supabase
            .from("rsvps")
            .select("status")
            .match({ event_id: eventId, attendee })
            .single();

          if (rsvps && rsvps.status !== "refunded") {
            // Update status in Supabase to checked_in
            await supabase
              .from("rsvps")
              .update({ status: "checked_in" })
              .match({ event_id: eventId, attendee });
              
            await processRefund(agentConfig.walletId, eventId, attendee);
          }
        }
      }
    }
  });

  // Watch for Supabase Realtime checkins (as fallback or secondary trigger)
  console.log("[Agent] Starting Supabase Realtime RSVP listener...");
  supabase
    .channel("rsvps-db-changes")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "rsvps" },
      async (payload) => {
        const { event_id, attendee, status } = payload.new;
        if (status === "checked_in") {
          console.log(`[Agent] Supabase check-in trigger: EventId=${event_id}, Attendee=${attendee}`);
          // Verify on-chain status first
          const isRefunded = await publicClient.readContract({
            address: TREASURY_ADDRESS,
            abi: TREASURY_ABI,
            functionName: "getRefundStatus",
            args: [event_id as `0x${string}`, attendee as `0x${string}`]
          });

          if (!isRefunded) {
            await processRefund(agentConfig.walletId, event_id, attendee);
          }
        }
      }
    )
    .subscribe();
}
