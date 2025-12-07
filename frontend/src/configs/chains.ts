import Chain from '@/types/Chain';

export const CHAIN_ID_ETHEREUM = 11155111;
export const CHAIN_ID_BASE = 84532;
export const CHAIN_ID_MEMECORE = 43522;

export const CHAIN_RPC_URL_ETHEREUM =
  process.env.NEXT_PUBLIC_CHAIN_RPC_URL_ETHEREUM || '';
export const CHAIN_RPC_URL_BASE =
  process.env.NEXT_PUBLIC_CHAIN_RPC_URL_BASE || '';
export const CHAIN_RPC_URL_MEMECORE =
  process.env.NEXT_PUBLIC_CHAIN_RPC_URL_MEMECORE || '';

export const CHAIN_RPC_URLS_ETHEREUM = [CHAIN_RPC_URL_ETHEREUM];
export const CHAIN_RPC_URLS_BASE = [CHAIN_RPC_URL_BASE];
export const CHAIN_RPC_URLS_MEMECORE = [CHAIN_RPC_URL_MEMECORE];

export const CHAIN_ETHEREUM: Chain = {
  id: CHAIN_ID_ETHEREUM,
  name: 'Ethereum',
  rpcUrls: CHAIN_RPC_URLS_ETHEREUM,
  explorerUrl: 'https://sepolia.etherscan.io',
};
export const CHAIN_BASE: Chain = {
  id: CHAIN_ID_BASE,
  name: 'Base',
  rpcUrls: CHAIN_RPC_URLS_BASE,
  explorerUrl: 'https://base-sepolia.blockscout.com',
};
export const CHAIN_MEMECORE: Chain = {
  id: CHAIN_ID_MEMECORE,
  name: 'Memecore',
  rpcUrls: CHAIN_RPC_URLS_MEMECORE,
  explorerUrl: 'https://insectarium.blockscout.memecore.com',
};

export const CHAIN_MAP = {
  [CHAIN_ID_ETHEREUM]: CHAIN_ETHEREUM,
  [CHAIN_ID_BASE]: CHAIN_BASE,
  [CHAIN_ID_MEMECORE]: CHAIN_MEMECORE,
};

export const AVAILABLE_CHAINS = [CHAIN_MEMECORE];

const CHAINS = [CHAIN_ETHEREUM, CHAIN_BASE, CHAIN_MEMECORE];

export default CHAINS;
