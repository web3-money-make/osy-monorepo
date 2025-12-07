require("dotenv").config();
const hre = require("hardhat");

// Network configurations
const NETWORKS = {
  ETH_SEPOLIA: {
    name: "Eth Sepolia",
    chainId: 11155111,
    rpcUrl: process.env.NODE_URI_ETH_TEST,
    pollingInterval: 12000, // 12 seconds
  },
  BASE_SEPOLIA: {
    name: "Base Sepolia",
    chainId: 84532,
    rpcUrl: process.env.NODE_URI_BASE_TEST,
    pollingInterval: 2000, // 2 seconds
  },
  INSECTARIUM: {
    name: "Insectarium",
    chainId: 43522,
    rpcUrl: process.env.NODE_URI_MEME_TEST,
    pollingInterval: 3000, // 3 seconds
  }
};

const BRIDGE_ADDRESS = "0xe3c509e828640EF69e73B4E7ED4D40426aE36FaD";
const RELAYER_KEY = process.env.RELAYER;
const DEPLOYER_KEY = process.env.DEPLOYER;
const BLOCK_RANGE = 10; // Query 1000 blocks at a time

// Bridge ABI (only the functions and events we need)
const BRIDGE_ABI = [
  "event BridgeRequested(bytes32 indexed requestHash, address sender, address recipient, uint256 chainId, uint256 amount, bytes data)",
  "function relay(tuple(uint256 sourceChainId, uint256 destinationChainId, address sender, uint256 amount, address recipient, bytes data) _bridgeRequest, bytes _signature) external",
  "function receiveNonces(uint256 chainId, address sender) external view returns (uint256)",
  "function executedRequests(bytes32 requestHash) external view returns (bool)"
];

class BridgeRelayerBot {
  constructor() {
    this.providers = {};
    this.bridges = {};
    this.relayerWallet = null;
    this.deployerWallet = null;
    this.processedEvents = new Set();
    this.lastProcessedBlock = {};
    this.pollingIntervals = {};
    this.isShuttingDown = false;
  }

  async initialize() {
    console.log("\n=== Bridge Relayer Bot Starting ===\n");

    // Initialize relayer wallet
    this.relayerWallet = new hre.ethers.Wallet(RELAYER_KEY);
    console.log("Relayer Address:", this.relayerWallet.address);

    // Initialize providers and contracts for each network
    for (const [key, network] of Object.entries(NETWORKS)) {
      console.log(`\nInitializing ${network.name} (Chain ID: ${network.chainId})...`);

      // Create provider
      this.providers[network.chainId] = new hre.ethers.JsonRpcProvider(network.rpcUrl);

      // Create deployer wallet for this network
      const deployerWallet = new hre.ethers.Wallet(DEPLOYER_KEY, this.providers[network.chainId]);

      // Create bridge contract instance (for reading with provider, for writing with deployer)
      this.bridges[network.chainId] = {
        read: new hre.ethers.Contract(BRIDGE_ADDRESS, BRIDGE_ABI, this.providers[network.chainId]),
        write: new hre.ethers.Contract(BRIDGE_ADDRESS, BRIDGE_ABI, deployerWallet),
        provider: this.providers[network.chainId],
        name: network.name,
        pollingInterval: network.pollingInterval
      };

      // Get current block number
      const currentBlock = await this.providers[network.chainId].getBlockNumber();
      this.lastProcessedBlock[network.chainId] = currentBlock;

      console.log(`✅ ${network.name} initialized (Current Block: ${currentBlock})`);
    }

    console.log("\n=== Bot Ready - Starting Event Polling ===\n");
  }

  async startPolling() {
    // Start polling for each chain
    for (const [chainId, bridge] of Object.entries(this.bridges)) {
      const sourceChainId = parseInt(chainId);

      console.log(`👂 Starting polling for ${bridge.name} (Chain ID: ${sourceChainId}), interval: ${bridge.pollingInterval}ms`);

      // Start polling loop for this chain
      this.pollingIntervals[sourceChainId] = setInterval(async () => {
        if (this.isShuttingDown) return;

        try {
          await this.pollEvents(sourceChainId);
        } catch (error) {
          console.error(`\n❌ Error polling ${bridge.name}:`, error.message);
        }
      }, bridge.pollingInterval);
    }

    console.log("\n✅ All polling loops active\n");
  }

  async pollEvents(sourceChainId) {
    const bridge = this.bridges[sourceChainId];

    try {
      // Get current block
      const currentBlock = await bridge.provider.getBlockNumber();
      const fromBlock = this.lastProcessedBlock[sourceChainId] + 1;

      // Skip if no new blocks
      if (fromBlock > currentBlock) {
        return;
      }

      // Limit the block range to avoid RPC limits
      const toBlock = Math.min(fromBlock + BLOCK_RANGE - 1, currentBlock);

      // Query events in this block range
      const filter = bridge.read.filters.BridgeRequested();
      const events = await bridge.read.queryFilter(filter, fromBlock, toBlock);

      // Process each event
      for (const event of events) {
        const [requestHash, sender, recipient, destinationChainId, amount, data] = event.args;

        // Create unique event ID using transaction hash + log index
        const eventId = `${event.transactionHash}-${event.index}`;

        // Skip if already processed or being processed
        if (this.processedEvents.has(eventId)) {
          console.log(`⏭️  Event ${eventId} already processed, skipping...`);
          continue;
        }

        // Mark as processed immediately to prevent duplicate processing
        this.processedEvents.add(eventId);

        // Process the event (don't await to allow parallel processing)
        this.handleBridgeRequest({
          requestHash,
          sender,
          recipient,
          destinationChainId: destinationChainId.toString(),
          amount: amount.toString(),
          data,
          sourceChainId,
          event,
          eventId
        }).catch(error => {
          console.error(`\n❌ Error handling event ${eventId}:`, error.message);
          // Keep it in processedEvents even on error to avoid retrying immediately
        });
      }

      // Update last processed block
      this.lastProcessedBlock[sourceChainId] = toBlock;

      // Log progress if we processed new blocks
      if (events.length > 0) {
        console.log(`📊 ${bridge.name}: Processed blocks ${fromBlock}-${toBlock}, found ${events.length} events`);
      }

    } catch (error) {
      // Don't throw, just log and continue
      console.error(`Error querying events on ${bridge.name}:`, error.message);
    }
  }

  async handleBridgeRequest(eventData) {
    const { requestHash, sender, recipient, destinationChainId, amount, data, sourceChainId, event, eventId } = eventData;

    const destChainIdNum = parseInt(destinationChainId);
    const sourceChainIdNum = parseInt(sourceChainId);

    console.log("\n" + "=".repeat(80));
    console.log(`🔔 NEW BRIDGE REQUEST DETECTED`);
    console.log("=".repeat(80));
    console.log(`Event ID: ${eventId}`);
    console.log(`Request Hash: ${requestHash}`);
    console.log(`Source Chain: ${this.bridges[sourceChainIdNum].name} (${sourceChainIdNum})`);
    console.log(`Destination Chain: ${this.bridges[destChainIdNum]?.name || 'Unknown'} (${destChainIdNum})`);
    console.log(`Sender: ${sender}`);
    console.log(`Recipient: ${recipient}`);
    console.log(`Amount: ${amount}`);
    console.log(`Data: ${data}`);
    console.log(`Block Number: ${event.blockNumber}`);
    console.log(`Transaction Hash: ${event.transactionHash}`);
    console.log("=".repeat(80));

    // Validate destination chain
    if (!this.bridges[destChainIdNum]) {
      console.log(`❌ Destination chain ${destChainIdNum} not supported`);
      return;
    }

    try {
      // Get receiveNonce from destination chain
      console.log(`\n📊 Fetching receiveNonce from destination chain...`);
      const receiveNonce = await this.bridges[destChainIdNum].read.receiveNonces(sourceChainIdNum, sender);
      console.log(`Receive Nonce: ${receiveNonce.toString()}`);

      // Build bridge request struct
      const bridgeRequest = {
        sourceChainId: sourceChainIdNum,
        destinationChainId: destChainIdNum,
        sender: sender,
        amount: amount,
        recipient: recipient,
        data: data
      };

      // Encode and hash (same as contract logic)
      const encoded = hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(uint256,uint256,address,uint256,address,bytes)", "uint256"],
        [
          [
            bridgeRequest.sourceChainId,
            bridgeRequest.destinationChainId,
            bridgeRequest.sender,
            bridgeRequest.amount,
            bridgeRequest.recipient,
            bridgeRequest.data
          ],
          receiveNonce
        ]
      );

      const calculatedRequestHash = hre.ethers.keccak256(encoded);
      console.log(`\n🔐 Calculated Request Hash: ${calculatedRequestHash}`);

      // Sign with relayer
      console.log(`\n✍️  Signing with relayer...`);
      const signature = await this.relayerWallet.signMessage(hre.ethers.getBytes(calculatedRequestHash));
      console.log(`Signature: ${signature}`);

      // Verify signature
      const recovered = hre.ethers.verifyMessage(hre.ethers.getBytes(calculatedRequestHash), signature);
      console.log(`Recovered Address: ${recovered}`);
      console.log(`Verification: ${recovered === this.relayerWallet.address ? "✅ PASS" : "❌ FAIL"}`);

      if (recovered !== this.relayerWallet.address) {
        throw new Error("Signature verification failed");
      }

      // Check if already executed on destination chain
      const isExecuted = await this.bridges[destChainIdNum].read.executedRequests(calculatedRequestHash);
      if (isExecuted) {
        console.log(`\n⚠️  Request already executed on destination chain, skipping...`);
        return;
      }

      // Send relay transaction to destination chain
      console.log(`\n📤 Sending relay transaction to ${this.bridges[destChainIdNum].name}...`);

      const tx = await this.bridges[destChainIdNum].write.relay(
        bridgeRequest,
        signature
      );

      console.log(`Transaction Hash: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();

      console.log(`\n✅ RELAY SUCCESSFUL`);
      console.log(`Block Number: ${receipt.blockNumber}`);
      console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
      console.log(`Status: ${receipt.status === 1 ? "Success" : "Failed"}`);

      // Log processed events count
      console.log(`\n📊 Total Processed Events: ${this.processedEvents.size}`);
      console.log("=".repeat(80) + "\n");

    } catch (error) {
      console.error(`\n❌ Error relaying bridge request:`, error.message);

      // Log more details for debugging
      if (error.data) {
        console.error("Error data:", error.data);
      }
      if (error.transaction) {
        console.error("Failed transaction:", error.transaction);
      }

      console.error(error);
      console.log("=".repeat(80) + "\n");
    }
  }

  async cleanup() {
    console.log("\n🛑 Shutting down bot...");
    this.isShuttingDown = true;

    // Clear all polling intervals
    for (const [chainId, interval] of Object.entries(this.pollingIntervals)) {
      clearInterval(interval);
      console.log(`✅ Stopped polling for chain ${chainId}`);
    }

    console.log("✅ Bot shutdown complete");
    process.exit(0);
  }
}

// Main execution
async function main() {
  const bot = new BridgeRelayerBot();

  // Handle graceful shutdown
  process.on("SIGINT", () => bot.cleanup());
  process.on("SIGTERM", () => bot.cleanup());

  try {
    await bot.initialize();
    await bot.startPolling();

    // Keep the process running
    await new Promise(() => {});
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
