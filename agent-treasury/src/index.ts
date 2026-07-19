import { walletsClient } from "./clients.js";
import { startWatchers } from "./watcher.js";
import { runInvoiceReview } from "./invoiceReview.js";
import { runEventSettlement } from "./settlement.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Local Config Path
const CONFIG_PATH = path.join(process.cwd(), "agent-config.json");

interface AgentConfig {
  walletId: string;
  address: string;
}

// Get or Create Agent Wallet
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

async function startAgent() {
  const agentConfig = await setupAgentWallet();

  console.log("[Agent] Catching up on missed CheckedIn events...");
  
  // Start real-time watchers for CheckedIn events and Supabase changes
  startWatchers(agentConfig);

  // Run periodic background jobs: invoice review and event settlement
  console.log("[Agent] Starting background jobs (invoice review and settlement polling)...");
  
  setInterval(() => {
    runInvoiceReview();
    runEventSettlement(agentConfig.walletId);
  }, 10000); // run every 10 seconds

  // Run immediately on start
  runInvoiceReview();
  runEventSettlement(agentConfig.walletId);
}

startAgent().catch((err) => {
  console.error("[Agent] Fatal Startup Error:", err);
  process.exit(1);
});
