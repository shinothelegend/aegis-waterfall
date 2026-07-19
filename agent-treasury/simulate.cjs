const { createPublicClient, createWalletClient, http, toHex } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config({ path: path.join(__dirname, '../.env') });

const RPC_URL = "https://rpc.testnet.arc.network";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;
const USDC_ADDRESS = process.env.USDC_ADDRESS;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!PRIVATE_KEY || !TREASURY_ADDRESS || !USDC_ADDRESS || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing configuration in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Minimal ABIs
const mockUsdcAbi = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
];

const eventTreasuryAbi = [
  {
    name: 'createEvent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'eventId', type: 'bytes32' },
      { name: 'ticketPriceUSDC', type: 'uint256' },
      { name: 'organizer', type: 'address' },
      { name: 'eventEndTime', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'eventId', type: 'bytes32' }],
    outputs: []
  },
  {
    name: 'checkIn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'eventId', type: 'bytes32' },
      { name: 'attendee', type: 'address' }
    ],
    outputs: []
  }
];

// Chain config
const customChain = {
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function simulate() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  const client = createPublicClient({
    chain: customChain,
    transport: http(RPC_URL)
  });
  const walletClient = createWalletClient({
    account,
    chain: customChain,
    transport: http(RPC_URL)
  });

  console.log(`[Simulator] Executor wallet address: ${account.address}`);

  // Generate a random unique Event ID
  const eventIdRaw = crypto.randomBytes(32);
  const eventId = toHex(eventIdRaw);
  const ticketPrice = 50n * 10n ** 6n; // 50 USDC (6 decimals)
  const endTime = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

  console.log(`\n--- 1. Creating Event: ${eventId} ---`);
  const createTx = await walletClient.writeContract({
    address: TREASURY_ADDRESS,
    abi: eventTreasuryAbi,
    functionName: 'createEvent',
    args: [eventId, ticketPrice, account.address, endTime]
  });
  console.log(`[Simulator] createEvent Tx: ${createTx}`);
  await sleep(8000);
  console.log("[Simulator] Event created successfully on-chain.");

  // Sync Event to Supabase
  console.log(`[Simulator] Syncing event to database...`);
  await supabase.from('events').insert({
    id: eventId,
    title: 'ETH Neo-Tokyo Simulator',
    description: 'Autonomous agent simulation event',
    date: new Date().toISOString(),
    location: 'Roppongi Hills, Tokyo',
    ticket_price: 50.0,
    organizer: account.address.toLowerCase(),
    end_time: Number(endTime)
  });
  console.log("[Simulator] Event synced to Supabase.");

  console.log(`\n--- 2. Minting MockUSDC to Attendee ---`);
  const mintTx = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: mockUsdcAbi,
    functionName: 'mint',
    args: [account.address, ticketPrice]
  });
  console.log(`[Simulator] mint Tx: ${mintTx}`);
  await sleep(8000);
  console.log("[Simulator] MockUSDC minted successfully.");

  console.log(`\n--- 3. Approving EventTreasury to spend USDC ---`);
  const approveTx = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: mockUsdcAbi,
    functionName: 'approve',
    args: [TREASURY_ADDRESS, ticketPrice]
  });
  console.log(`[Simulator] approve Tx: ${approveTx}`);
  await sleep(8000);
  console.log("[Simulator] USDC approved successfully.");

  console.log(`\n--- 4. Depositing Ticket Escrow ---`);
  const depositTx = await walletClient.writeContract({
    address: TREASURY_ADDRESS,
    abi: eventTreasuryAbi,
    functionName: 'deposit',
    args: [eventId]
  });
  console.log(`[Simulator] deposit Tx: ${depositTx}`);
  await sleep(8000);
  console.log("[Simulator] Escrow deposit completed.");

  // Sync RSVP to Supabase
  console.log(`[Simulator] Syncing RSVP to database...`);
  await supabase.from('rsvps').insert({
    event_id: eventId,
    attendee: account.address.toLowerCase(),
    tx_hash: depositTx,
    status: 'deposited'
  });
  console.log("[Simulator] RSVP synced to Supabase.");

  console.log(`\n--- 5. Checking in Attendee (Triggers Autonomous Refund) ---`);
  const checkinTx = await walletClient.writeContract({
    address: TREASURY_ADDRESS,
    abi: eventTreasuryAbi,
    functionName: 'checkIn',
    args: [eventId, account.address]
  });
  console.log(`[Simulator] checkIn Tx: ${checkinTx}`);
  await sleep(8000);
  console.log("[Simulator] Check-in registered on-chain!");
  console.log("\n[Simulator] Simulation steps completed! Watching for agent to execute refund...");
}

simulate().catch(err => {
  console.error("Simulation failed:", err);
  process.exit(1);
});
