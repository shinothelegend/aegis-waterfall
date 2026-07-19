import { 
  supabase, 
  walletsClient, 
  publicClient, 
  TREASURY_ADDRESS, 
  ATTESTATION_ADDRESS, 
  ATTESTATION_ABI 
} from "./clients.js";
import { performFraudCheck } from "./fraudCheck.js";
import crypto from "crypto";
import { type Hash, parseEventLogs } from "viem";

// Helper: Wait for Circle Transaction to complete
export async function waitForTxCompletion(txId: string): Promise<string> {
  console.log(`[Agent] Waiting for transaction ${txId} to complete...`);
  const maxRetries = 20;
  const delayMs = 3000;

  for (let i = 0; i < maxRetries; i++) {
    const response = await walletsClient.getTransaction({ id: txId });
    const transaction = response.data?.transaction;
    
    if (transaction) {
      if (transaction.state === "COMPLETE") {
        console.log(`[Agent] Transaction completed successfully. Hash: ${transaction.txHash}`);
        return transaction.txHash!;
      } else if (["FAILED", "CANCELLED", "DENIED"].includes(transaction.state)) {
        throw new Error(`Transaction ended in state: ${transaction.state}`);
      }
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  throw new Error("Transaction completion timeout");
}

/**
 * Evaluates fraud pattern and runs the on-chain ticket refund and SBT badge minting process.
 */
export async function processRefund(
  walletId: string,
  eventId: string,
  attendee: string
) {
  const lowercaseAttendee = attendee.toLowerCase();
  try {
    // 1. Execute LLM-powered Anti-fraud reasoning check
    const fraudResult = await performFraudCheck(eventId, lowercaseAttendee);
    if (!fraudResult.approved) {
      console.warn(`[Agent] Refund blocked for attendee ${lowercaseAttendee} due to fraud check rejection!`);
      
      // Update RSVP status in Supabase to flagged
      await supabase
        .from("rsvps")
        .update({ status: "flagged_fraud", updated_at: new Date().toISOString() })
        .match({ event_id: eventId, attendee: lowercaseAttendee });

      // Log decision in Supabase
      await supabase.from("agent_decisions").insert({
        event_id: eventId,
        trigger_type: "check_in",
        target_address: lowercaseAttendee,
        decision: "rejected",
        reasoning: `Anti-fraud check REJECTED check-in refund. Reason: ${fraudResult.reasoning}`
      });
      return;
    }

    console.log(`[Agent] Anti-fraud check PASSED for ${attendee}. Proceeding to refund...`);

    // 2. Call EventTreasury.refund(eventId, attendee)
    const response = await walletsClient.createContractExecutionTransaction({
      walletId: walletId,
      contractAddress: TREASURY_ADDRESS,
      abiFunctionSignature: "refund(bytes32,address)",
      abiParameters: [eventId, attendee],
      idempotencyKey: crypto.randomUUID(),
      fee: { type: "level", config: { feeLevel: "MEDIUM" } }
    });

    const txId = response.data?.id;
    if (!txId) {
      throw new Error("Failed to submit refund transaction to Circle SDK");
    }

    const txHash = await waitForTxCompletion(txId);
    
    // Parse receipt to extract Minted Attestation Token ID
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as Hash });
    const attestationLogs = parseEventLogs({
      abi: ATTESTATION_ABI,
      eventName: "AttestationMinted",
      logs: receipt.logs
    });

    let tokenIdStr = "";
    if (attestationLogs.length > 0) {
      const tokenId = attestationLogs[0].args.tokenId;
      tokenIdStr = tokenId.toString();
      console.log(`[Agent] Minted Check-in Attestation SBT Token ID: ${tokenIdStr}`);
      
      // Update SBT on-chain with the refund transaction hash
      console.log(`[Agent] Writing refund transaction hash to SBT #${tokenIdStr} on-chain...`);
      const updateSbtResponse = await walletsClient.createContractExecutionTransaction({
        walletId: walletId,
        contractAddress: ATTESTATION_ADDRESS,
        abiFunctionSignature: "setRefundTxHash(uint256,string)",
        abiParameters: [tokenIdStr, txHash],
        idempotencyKey: crypto.randomUUID(),
        fee: { type: "level", config: { feeLevel: "MEDIUM" } }
      });

      const sbtTxId = updateSbtResponse.data?.id;
      if (sbtTxId) {
        await waitForTxCompletion(sbtTxId);
        console.log(`[Agent] On-chain SBT #${tokenIdStr} updated with refund tx hash.`);
      }
    }

    // Update Supabase RSVP status
    await supabase
      .from("rsvps")
      .update({ status: "refunded", tx_hash: txHash, updated_at: new Date().toISOString() })
      .match({ event_id: eventId, attendee: lowercaseAttendee });

    // Log decision in Supabase
    await supabase.from("agent_decisions").insert({
      event_id: eventId,
      trigger_type: "check_in",
      target_address: lowercaseAttendee,
      decision: "processed",
      reasoning: `Autonomous refund approved. ${fraudResult.reasoning} SBT Attestation #${tokenIdStr || "N/A"} minted and updated with refund transaction hash.`,
      tx_hash: txHash
    });

    console.log(`[Agent] Refund successfully completed for ${lowercaseAttendee}`);

  } catch (error: any) {
    console.error(`[Agent] Error processing refund for ${lowercaseAttendee}:`, error.message || error);
    
    // Log failed decision
    await supabase.from("agent_decisions").insert({
      event_id: eventId,
      trigger_type: "check_in",
      target_address: lowercaseAttendee,
      decision: "failed",
      reasoning: `Failed to execute refund: ${error.message || error}`,
    });
  }
}
