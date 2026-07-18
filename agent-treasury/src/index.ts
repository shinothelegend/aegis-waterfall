import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createClient } from "@supabase/supabase-js";
import { createPublicClient, http, parseEventLogs, type Hash } from "viem";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configuration validation
const requiredEnv = [
  "CIRCLE_API_KEY",
  "ENTITY_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TREASURY_ADDRESS",
  "ATTESTATION_ADDRESS",
  "USDC_ADDRESS",
  "LLM_API_KEY"
];

for (const env of requiredEnv) {
  if (!process.env[env]) {
    console.error(`[Error] Missing required environment variable: ${env}`);
    process.exit(1);
  }
}

const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS as `0x${string}`;
const ATTESTATION_ADDRESS = process.env.ATTESTATION_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.USDC_ADDRESS as `0x${string}`;

// Initialize clients
const walletsClient = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.ENTITY_SECRET!,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define Arc Testnet Chain
const arcTestnet = {
  id: 5042002,
  name: "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "USDC",
    symbol: "USDC",
  },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
    public: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
};

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

// Initialize LLM Client
const llmClient = new OpenAI({
  apiKey: process.env.LLM_API_KEY!,
  baseURL: process.env.LLM_BASE_URL || undefined, // can target Grok, Claude-compat, etc.
});
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

// Contract ABIs
const TREASURY_ABI = [
  {
    type: "event",
    name: "CheckedIn",
    inputs: [
      { name: "eventId", type: "bytes32", indexed: true },
      { name: "attendee", type: "address", indexed: true }
    ]
  },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "eventId", type: "bytes32", indexed: true },
      { name: "attendee", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "Refunded",
    inputs: [
      { name: "eventId", type: "bytes32", indexed: true },
      { name: "attendee", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "tokenId", type: "uint256", indexed: false }
    ]
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
    name: "getRefundStatus",
    inputs: [
      { name: "eventId", type: "bytes32" },
      { name: "attendee", type: "address" }
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getEventBalance",
    inputs: [{ name: "eventId", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  }
] as const;

const ATTESTATION_ABI = [
  {
    type: "event",
    name: "AttestationMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "attendee", type: "address", indexed: true },
      { name: "eventId", type: "bytes32", indexed: true }
    ]
  }
] as const;

// Local Config Path
const CONFIG_PATH = path.join(process.cwd(), "agent-config.json");

interface AgentConfig {
  walletId: string;
  address: string;
}

// 1. Get or Create Agent Wallet
async function setupAgentWallet(): Promise<AgentConfig> {
  if (fs.existsSync(CONFIG_PATH)) {
    console.log("[Agent] Config file found. Loading wallet details...");
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    console.log(`[Agent] Wallet Address: ${config.address}`);
    console.log(`[Agent] Wallet ID: ${config.walletId}`);
    return config;
  }

  console.log("[Agent] Config file not found. Creating a new Developer-Controlled Wallet...");
  
  // Create Wallet Set
  const walletSetResponse = await walletsClient.createWalletSet({
    name: `Checkpoint Agent Set ${crypto.randomBytes(4).toString("hex")}`
  });
  const walletSetId = walletSetResponse.data?.walletSet?.id;
  if (!walletSetId) {
    throw new Error("Failed to create wallet set");
  }

  // Create Wallet on Arc Testnet
  const walletsResponse = await walletsClient.createWallets({
    walletSetId,
    blockchains: ["ARC-TESTNET"],
    count: 1
  });
  
  const wallet = walletsResponse.data?.wallets?.[0];
  if (!wallet || !wallet.id || !wallet.address) {
    throw new Error("Failed to create wallet");
  }

  const agentConfig: AgentConfig = {
    walletId: wallet.id,
    address: wallet.address
  };

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(agentConfig, null, 2));
  console.log("====================================================");
  console.log(`[Agent] NEW WALLET CREATED!`);
  console.log(`[Agent] Wallet Address: ${agentConfig.address}`);
  console.log(`[Agent] Wallet ID: ${agentConfig.walletId}`);
  console.log(`[Agent] PLEASE FUND THIS WALLET WITH USDC FOR GAS AT: https://faucet.circle.com`);
  console.log("====================================================");

  return agentConfig;
}

// Helper: Wait for Circle Transaction to complete
async function waitForTxCompletion(txId: string): Promise<string> {
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

// 2. Main Logic: Refund processing
async function processRefund(agentConfig: AgentConfig, eventId: string, attendee: string) {
  try {
    console.log(`[Agent] Initiating autonomous refund for ${attendee} (Event: ${eventId})...`);
    
    // Call EventTreasury.refund(eventId, attendee)
    const response = await walletsClient.createContractExecutionTransaction({
      walletId: agentConfig.walletId,
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
        walletId: agentConfig.walletId,
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
      .match({ event_id: eventId, attendee });

    // Log decision in Supabase
    await supabase.from("agent_decisions").insert({
      event_id: eventId,
      trigger_type: "check_in",
      target_address: attendee,
      decision: "processed",
      reasoning: `Autonomous refund triggered by verified check-in. Refunded ticket price. SBT Attestation #${tokenIdStr || "N/A"} minted and updated with refund transaction hash.`,
      tx_hash: txHash
    });

    console.log(`[Agent] Refund successfully completed for ${attendee}`);

  } catch (error: any) {
    console.error(`[Agent] Error processing refund for ${attendee}:`, error.message || error);
    
    // Log failed decision
    await supabase.from("agent_decisions").insert({
      event_id: eventId,
      trigger_type: "check_in",
      target_address: attendee,
      decision: "rejected",
      reasoning: `Failed to execute refund: ${error.message || error}`,
    });
  }
}

// 3. Main Logic: Invoice Review Loop
async function runInvoiceReview(agentConfig: AgentConfig) {
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
        reasoning: result.reasoning
      });
    }
  } catch (error) {
    console.error("[Agent] Error in invoice review loop:", error);
  }
}

// 4. Main Logic: Event Settlement
async function runEventSettlement(agentConfig: AgentConfig) {
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
        walletId: agentConfig.walletId,
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

// 5. Setup Event Watcher & Catch-up Loop
async function startAgent() {
  const agentConfig = await setupAgentWallet();

  console.log("[Agent] Catching up on missed CheckedIn events...");
  
  // Real-time listener for on-chain events
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
              
            await processRefund(agentConfig, eventId, attendee);
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
            await processRefund(agentConfig, event_id, attendee);
          }
        }
      }
    )
    .subscribe();

  // Run periodic background jobs: invoice review and event settlement
  console.log("[Agent] Starting background jobs (invoice review and settlement polling)...");
  
  setInterval(() => {
    runInvoiceReview(agentConfig);
    runEventSettlement(agentConfig);
  }, 10000); // run every 10 seconds

  // Run immediately on start
  runInvoiceReview(agentConfig);
  runEventSettlement(agentConfig);
}

startAgent().catch((err) => {
  console.error("[Agent] Fatal Startup Error:", err);
  process.exit(1);
});
