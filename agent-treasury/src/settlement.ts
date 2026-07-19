import { 
  supabase, 
  walletsClient, 
  publicClient, 
  TREASURY_ADDRESS, 
  TREASURY_ABI 
} from "./clients.js";
import { waitForTxCompletion } from "./refund.js";
import crypto from "crypto";

export async function runEventSettlement(walletId: string) {
  try {
    // Query ended events in database that are not settled
    const nowUnix = Math.floor(Date.now() / 1000);
    const { data: events, error } = await supabase
      .from("events")
      .select("id, end_time, title, organizer")
      .lt("end_time", nowUnix); // ended

    if (error) throw error;
    if (!events || events.length === 0) return;

    for (const ev of events) {
      // Check on-chain if event is settled
      const eventDetails = await publicClient.readContract({
        address: TREASURY_ADDRESS,
        abi: TREASURY_ABI,
        functionName: "getEvent",
        args: [ev.id as `0x${string}`]
      });

      const onChainSettled = eventDetails[3];
      const onChainBalance = eventDetails[4];

      if (onChainSettled || onChainBalance === 0n) {
        continue;
      }

      console.log(`[Agent] Event "${ev.title}" has ended and requires on-chain settlement.`);

      // Query approved invoices for this event
      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("vendor_address, amount, id")
        .eq("event_id", ev.id)
        .eq("status", "approved");

      if (invError) throw invError;

      const vendors: string[] = [];
      const amounts: string[] = [];
      let totalVendorPayout = 0n;

      if (invoices && invoices.length > 0) {
        for (const invoice of invoices) {
          vendors.push(invoice.vendor_address);
          // Convert amount to USDC uint256 string (6 decimals)
          const amountUint = BigInt(Math.floor(Number(invoice.amount) * 10**6));
          amounts.push(amountUint.toString());
          totalVendorPayout += amountUint;
        }
      }

      if (onChainBalance < totalVendorPayout) {
        console.error(`[Agent] Error: Event balance (${onChainBalance}) is less than total approved vendor payouts (${totalVendorPayout})! Skipping settlement.`);
        continue;
      }

      console.log(`[Agent] Settling Event ${ev.id}: total vendor payout = ${Number(totalVendorPayout) / 10**6} USDC. Organizer payout = ${Number(onChainBalance - totalVendorPayout) / 10**6} USDC.`);

      // Execute settleEvent(eventId, vendors, amounts)
      const response = await walletsClient.createContractExecutionTransaction({
        walletId: walletId,
        contractAddress: TREASURY_ADDRESS,
        abiFunctionSignature: "settleEvent(bytes32,address[],uint256[])",
        abiParameters: [ev.id, vendors, amounts],
        idempotencyKey: crypto.randomUUID(),
        fee: { type: "level", config: { feeLevel: "MEDIUM" } }
      });

      const txId = response.data?.id;
      if (!txId) {
        throw new Error("Failed to submit settleEvent transaction to Circle SDK");
      }

      const txHash = await waitForTxCompletion(txId);

      // Update database invoices as paid
      if (invoices && invoices.length > 0) {
        const invoiceIds = invoices.map(i => i.id);
        await supabase
          .from("invoices")
          .update({ status: "paid" })
          .in("id", invoiceIds);
      }

      // Log agent decision
      await supabase.from("agent_decisions").insert({
        event_id: ev.id,
        trigger_type: "settle",
        target_address: ev.organizer,
        decision: "processed",
        reasoning: `Event ended. Settled payouts autonomously. Paid ${vendors.length} vendors total of ${Number(totalVendorPayout) / 10**6} USDC and paid remaining balance of ${Number(onChainBalance - totalVendorPayout) / 10**6} USDC to organizer.`,
        tx_hash: txHash
      });

      console.log(`[Agent] Event ${ev.id} settled successfully.`);
    }
  } catch (error) {
    console.error("[Agent] Error in event settlement:", error);
  }
}
