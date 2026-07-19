import { walletsClient } from "./clients.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "agent-config.json");

interface AgentConfig {
  walletId: string;
  address: string;
}

async function setupAgentWallet(): Promise<AgentConfig> {
  if (fs.existsSync(CONFIG_PATH)) {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    console.log("AGENT_ADDRESS=" + config.address);
    return config;
  }

  const walletSetResponse = await walletsClient.createWalletSet({
    name: `Checkpoint Agent Set ${crypto.randomBytes(4).toString("hex")}`
  });
  const walletSetId = walletSetResponse.data?.walletSet?.id;
  if (!walletSetId) {
    throw new Error("Failed to create wallet set");
  }

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
  console.log("AGENT_ADDRESS=" + agentConfig.address);
  return agentConfig;
}

setupAgentWallet().catch(err => {
  console.error("Error creating wallet:", err);
  process.exit(1);
});
