import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createClient } from "@supabase/supabase-js";
import { createPublicClient, http } from "viem";
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

export const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS as `0x${string}`;
export const ATTESTATION_ADDRESS = process.env.ATTESTATION_ADDRESS as `0x${string}`;
export const USDC_ADDRESS = process.env.USDC_ADDRESS as `0x${string}`;

// Initialize clients
export const walletsClient = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.ENTITY_SECRET!,
});

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define Arc Testnet Chain
export const arcTestnet = {
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

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

// Initialize LLM Client
export const llmClient = new OpenAI({
  apiKey: process.env.LLM_API_KEY!,
  baseURL: process.env.LLM_BASE_URL || undefined,
});
export const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

// Contract ABIs
export const TREASURY_ABI = [
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

export const ATTESTATION_ABI = [
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
