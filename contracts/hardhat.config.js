require('@nomicfoundation/hardhat-network-helpers');
require('@nomicfoundation/hardhat-toolbox');
require('hardhat-gas-reporter');
require('hardhat-deploy');
require('hardhat-tracer');
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.21",
        settings: {
          evmVersion: "shanghai"
        },
      }
    ],
  },
  networks: {
    hardhat: {
      // Use default accounts for testing (no forking)
      // Uncomment ONE of the forking options below to test with real networks:

      // Option 1: Fork Insectarium (test MainChainVault)
      forking: {
        url: process.env.NODE_URI_MEME_TEST
      },
      chainId: 43522,

      // Option 2: Fork Eth Sepolia (test with real USDC + Compound V3)
      // forking: {
      //   url: process.env.NODE_URI_ETH_TEST,
      // },
      // chainId: 11155111,

      // Option 3: Fork Base Sepolia (test with real USDC + Compound V3)
      // forking: {
      //   url: process.env.NODE_URI_BASE_TEST,
      // },
      // chainId: 84532,
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      accounts: [process.env.DEPLOYER, process.env.RELAYER],
      gas: 10000000,
      chainId: 43522
    },
    MEME_TEST: {
      url: process.env.NODE_URI_MEME_TEST || "",
      accounts: [process.env.DEPLOYER, process.env.RELAYER],
      gas: 10000000,
      chainId: 43522
    },
    ETH_TEST: {
      url: process.env.NODE_URI_ETH_TEST || "",
      accounts: [process.env.DEPLOYER, process.env.RELAYER],
      gas: 10000000,
      chainId: 11155111
    },
    BASE_TEST: {
      url: process.env.NODE_URI_BASE_TEST || "",
      accounts: [process.env.DEPLOYER, process.env.RELAYER],
      gas: 10000000,
      chainId: 84532
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    relayer: {
      default: 1
    }
  },
  mocha: {
    timeout: 10000000000
  },
  gasReporter: {
    enabled: true,
    trackGasDeltas: true
  }
};