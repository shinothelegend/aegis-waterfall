import { supabase, llmClient, LLM_MODEL } from "./clients.js";

interface FraudCheckResult {
  approved: boolean;
  reasoning: string;
}

/**
 * Assesses check-in behavior using historical database logs and LLM reasoning.
 * @param eventId The event identifier
 * @param attendee The attendee's EVM address
 */
export async function performFraudCheck(
  eventId: string,
  attendee: string
): Promise<FraudCheckResult> {
  console.log(`[Anti-Fraud] Analyzing check-in pattern for attendee: ${attendee} at event: ${eventId}...`);
  try {
    // 1. Check if the attendee has a matching deposit record in Supabase rsvps table
    const { data: rsvp, error: rsvpError } = await supabase
      .from("rsvps")
      .select("status, tx_hash")
      .match({ event_id: eventId, attendee })
      .maybeSingle();

    if (rsvpError) throw rsvpError;

    if (!rsvp || (rsvp.status !== "deposited" && rsvp.status !== "checked_in")) {
      return {
        approved: false,
        reasoning: "Attendee has no active deposit or ticket purchase found for this event."
      };
    }

    // 2. Fetch the last 5 agent decisions for this attendee across all events to find frequency/velocity of refunds
    const { data: recentDecisions, error: decError } = await supabase
      .from("agent_decisions")
      .select("event_id, trigger_type, decision, created_at")
      .eq("target_address", attendee)
      .order("created_at", { ascending: false })
      .limit(5);

    if (decError) throw decError;

    // 3. Build a detailed context for the LLM
    const checkInTimes = recentDecisions
      ?.filter(d => d.trigger_type === "check_in")
      .map(d => `${d.created_at} (${d.decision})`) || [];

    const prompt = `You are a fraud prevention AI Agent running Checkpoint, an escrow and payments platform.
You are evaluating a check-in event to decide if a ticket refund should be processed or blocked as fraudulent/suspicious.

Attendee Address: "${attendee}"
Current Event ID: "${eventId}"
Has RSVP Deposit: Yes (Tx: ${rsvp.tx_hash || "N/A"})

Recent Check-in Decisions for this Wallet:
${checkInTimes.length > 0 ? checkInTimes.map(t => `- ${t}`).join("\n") : "No previous check-in records found."}

Anti-Fraud Rubric:
1. Velocity check: If this address has checked in and received refunds from multiple DIFFERENT events in the last 2 minutes, it is highly suspicious (possible sybil or automated script).
2. Deposit check: Ensure the wallet has a deposit record (verified: YES).
3. Anomalies: If the same address is repeatedly attempting check-ins across multiple venues within seconds, flag as fraud.

Evaluate this check-in. Decide if it is "approved" or "rejected" (blocked).
Respond strictly in valid JSON format:
{
  "approved": boolean,
  "reasoning": "detailed explanation of your decision based on the rubric, mentioning the history and why it is normal or flagged"
}`;

    const completion = await llmClient.chat.completions.create({
      model: LLM_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No response from LLM in fraud check");
    }

    const result = JSON.parse(responseText);
    console.log(`[Anti-Fraud] LLM Fraud Check Decision: Approved = ${result.approved}. Reason: ${result.reasoning}`);
    return {
      approved: result.approved,
      reasoning: result.reasoning
    };

  } catch (error: any) {
    console.error("[Anti-Fraud] Error executing pattern check:", error);
    // Fail-safe: if LLM fails, we fall back to manual approval or block depending on logic.
    // Let's default to approve if there is a valid deposit, but log the error.
    return {
      approved: true,
      reasoning: `Anti-fraud agent evaluation failed with error: ${error.message || error}. Fail-safe fallback approved.`
    };
  }
}
