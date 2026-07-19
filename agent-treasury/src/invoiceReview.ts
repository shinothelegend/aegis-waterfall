import { 
  supabase, 
  llmClient, 
  LLM_MODEL, 
  publicClient, 
  TREASURY_ADDRESS, 
  TREASURY_ABI 
} from "./clients.js";

export async function runInvoiceReview() {
  try {
    // Query pending invoices
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*, events(title, ticket_price)")
      .eq("status", "pending");

    if (error) throw error;
    if (!invoices || invoices.length === 0) return;

    console.log(`[Agent] Found ${invoices.length} pending invoices to review.`);

    for (const invoice of invoices) {
      console.log(`[Agent] Reviewing invoice ${invoice.id} for Vendor ${invoice.vendor_address}...`);
      
      const eventId = invoice.event_id;
      const vendorAddress = invoice.vendor_address;
      const invoiceAmount = Number(invoice.amount);
      const invoiceFileUrl = invoice.file_url;
      const eventTitle = invoice.events?.title || "Unknown Event";

      // Query event balance from smart contract
      const contractDetails = await publicClient.readContract({
        address: TREASURY_ADDRESS,
        abi: TREASURY_ABI,
        functionName: "getEvent",
        args: [eventId as `0x${string}`]
      });
      
      const ticketPriceEscrow = Number(contractDetails[0]) / 10**6; // Convert to decimal USDC
      const eventEscrowBalance = Number(contractDetails[4]) / 10**6;

      // Request LLM review
      const prompt = `You are a financial controller AI Agent running Checkpoint, an escrow and payments platform.
You are reviewing vendor invoice metadata against the event context.

Event Context:
- Event Title: "${eventTitle}"
- Event ID: "${eventId}"
- Ticket Price: ${ticketPriceEscrow} USDC
- Current Treasury Balance: ${eventEscrowBalance} USDC

Invoice to Review:
- Vendor Address: "${vendorAddress}"
- Requested Payout Amount: ${invoiceAmount} USDC
- Invoice Document Attachment URL: "${invoiceFileUrl}"

Review Rubric:
1. Is the requested payout amount reasonable compared to the current event escrow balance? (Payout amount must be less than or equal to the treasury escrow balance: ${eventEscrowBalance} USDC).
2. Is the vendor address formatted as a valid EVM address?
3. Check the file extension/link. Ensure it looks like a valid document attachment (PDF or Image URL).

Respond strictly in valid JSON format:
{
  "approved": boolean,
  "reasoning": "detailed explanation of why the invoice was approved or rejected based on the rubric"
}`;

      const completion = await llmClient.chat.completions.create({
        model: LLM_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("No response from LLM");
      }

      const result = JSON.parse(responseText);
      console.log(`[Agent] LLM Decision for invoice ${invoice.id}: Approved = ${result.approved}. Reason: ${result.reasoning}`);

      // Update invoice in Supabase
      const status = result.approved ? "approved" : "rejected";
      await supabase
        .from("invoices")
        .update({ status, feedback: result.reasoning })
        .eq("id", invoice.id);

      // Log agent decision
      await supabase.from("agent_decisions").insert({
        event_id: eventId,
        trigger_type: "invoice_approval",
        target_address: vendorAddress,
        decision: status,
        reasoning: `Vendor invoice approval review completed. Status: ${status.toUpperCase()}. LLM Decision: ${result.reasoning}`
      });
    }
  } catch (error) {
    console.error("[Agent] Error in invoice review loop:", error);
  }
}
