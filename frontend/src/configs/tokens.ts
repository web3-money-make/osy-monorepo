import Token from '@/types/Token';
import { CHAIN_ID_ETHEREUM, CHAIN_ID_BASE, CHAIN_ID_MEMECORE } from './chains';

export const TOKEN_ADDRESS_ETHEREUM_CUSDC =
  '0xAec1F48e02Cfb822Be958B68C7957156EB3F0b6e';
export const TOKEN_ADDRESS_ETHEREUM_USDC =
  '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
export const TOKEN_ADDRESS_BASE_CUSDC =
  '0x571621Ce60Cebb0c1D442B5afb38B1663C6Bf017';
export const TOKEN_ADDRESS_BASE_USDC =
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
export const TOKEN_ADDRESS_MEMECORE_OSYUSD =
  '0x65bcE65dAF428dd65D8Ba683da793462e9292bfa';
export const TOKEN_ADDRESS_MEMECORE_USDC =
  '0x92574e62D8788ECC5D17F9c1bC2711673ad9f50E';

export const TOKEN_ETHEREUM_CUSDC: Token = {
  chainId: CHAIN_ID_ETHEREUM,
  address: TOKEN_ADDRESS_ETHEREUM_CUSDC,
  symbol: 'cUSDC',
  decimals: 6,
  name: 'cUSDC',
  isCoin: false,
};
export const TOKEN_ETHEREUM_USDC: Token = {
  chainId: CHAIN_ID_ETHEREUM,
  address: TOKEN_ADDRESS_ETHEREUM_USDC,
  symbol: 'USDC',
  decimals: 6,
  name: 'USDC',
  isCoin: false,
};
export const TOKEN_BASE_CUSDC: Token = {
  chainId: CHAIN_ID_BASE,
  address: TOKEN_ADDRESS_BASE_CUSDC,
  symbol: 'cUSDC',
  decimals: 6,
  name: 'cUSDC',
  isCoin: false,
};
export const TOKEN_BASE_USDC: Token = {
  chainId: CHAIN_ID_BASE,
  address: TOKEN_ADDRESS_BASE_USDC,
  symbol: 'USDC',
  decimals: 6,
  name: 'USDC',
  isCoin: false,
};
export const TOKEN_MEMECORE_OSYUSD: Token = {
  chainId: CHAIN_ID_MEMECORE,
  address: TOKEN_ADDRESS_MEMECORE_OSYUSD,
  symbol: 'osyUSD',
  decimals: 6,
  name: 'osyUSD',
  isCoin: false,
};
export const TOKEN_MEMECORE_USDC: Token = {
  chainId: CHAIN_ID_MEMECORE,
  address: TOKEN_ADDRESS_MEMECORE_USDC,
  symbol: 'USDC',
  decimals: 6,
  name: 'USDC',
  isCoin: false,
};

export const TOKENS_ETHEREUM = [TOKEN_ETHEREUM_CUSDC, TOKEN_ETHEREUM_USDC];
export const TOKENS_BASE = [TOKEN_BASE_CUSDC, TOKEN_BASE_USDC];
export const TOKENS_MEMECORE = [TOKEN_MEMECORE_OSYUSD, TOKEN_MEMECORE_USDC];

export const TOKEN_MAP = {
  [TOKEN_ADDRESS_ETHEREUM_CUSDC]: TOKEN_ETHEREUM_CUSDC,
  [TOKEN_ADDRESS_ETHEREUM_USDC]: TOKEN_ETHEREUM_USDC,
  [TOKEN_ADDRESS_BASE_CUSDC]: TOKEN_BASE_CUSDC,
  [TOKEN_ADDRESS_BASE_USDC]: TOKEN_BASE_USDC,
  [TOKEN_ADDRESS_MEMECORE_OSYUSD]: TOKEN_MEMECORE_OSYUSD,
  [TOKEN_ADDRESS_MEMECORE_USDC]: TOKEN_MEMECORE_USDC,
};

const TOKENS = [...TOKENS_ETHEREUM, ...TOKENS_BASE, ...TOKENS_MEMECORE];

export default TOKENS;
