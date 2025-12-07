import { ContractInterface, ethers } from 'ethers';
import AbiEntrypoint from '@/assets/abi/entrypoint.json';
import AbiErc20 from '@/assets/abi/erc20.json';
import AbiSimpleAccount from '@/assets/abi/simpleAccount.json';
import AbiSimpleAccountFactory from '@/assets/abi/simpleAccountFactory.json';
import OmniVault from '@/assets/abi/omniVault.json';
import {
  TOKEN_ADDRESS_BASE_CUSDC,
  TOKEN_ADDRESS_BASE_USDC,
  TOKEN_ADDRESS_ETHEREUM_CUSDC,
  TOKEN_ADDRESS_ETHEREUM_USDC,
  TOKEN_ADDRESS_MEMECORE_OSYUSD,
  TOKEN_ADDRESS_MEMECORE_USDC,
} from '@/configs/tokens';
import { formatUnit } from '@/utils/format';
import {
  CHAIN_RPC_URL_BASE,
  CHAIN_RPC_URL_ETHEREUM,
  CHAIN_RPC_URL_MEMECORE,
} from '@/configs/chains';

const ethereumProvider = new ethers.providers.JsonRpcProvider(
  CHAIN_RPC_URL_ETHEREUM
);
const baseProvider = new ethers.providers.JsonRpcProvider(CHAIN_RPC_URL_BASE);
const memecoreProvider = new ethers.providers.JsonRpcProvider(
  CHAIN_RPC_URL_MEMECORE
);
const saltNumber = 13;

export async function encodeApproveCallData(
  to: string,
  amount: string,
  decimal: ethers.BigNumberish
) {
  const transferInterface = new ethers.utils.Interface([
    'function approve(address spender, uint256 value) external returns (bool)',
  ]);
  return transferInterface.encodeFunctionData('approve', [
    to,
    ethers.utils.parseUnits(amount, decimal),
  ]);
}

export async function encodeDeposit(
  amount: string,
  decimal: ethers.BigNumberish
) {
  const omniVault = await createContractFromFile(
    '0x6D9FfE31dFc72E4fD486Db5701F82d76Ccb1c8Ea',
    memecoreProvider,
    OmniVault as ContractInterface
  );
  const omniVaultInterface = new ethers.utils.Interface(
    omniVault.interface.format(ethers.utils.FormatTypes.json)
  );
  const bridgeCallData = await omniVaultInterface.encodeFunctionData(
    'deposit',
    [ethers.utils.parseUnits(amount, decimal)]
  );
  return bridgeCallData;
}

export async function encodeWithdraw(
  amount: string,
  decimal: ethers.BigNumberish
) {
  const omniVault = await createContractFromFile(
    '0x6D9FfE31dFc72E4fD486Db5701F82d76Ccb1c8Ea',
    memecoreProvider,
    OmniVault as ContractInterface
  );
  const omniVaultInterface = new ethers.utils.Interface(
    omniVault.interface.format(ethers.utils.FormatTypes.json)
  );
  const bridgeCallData = await omniVaultInterface.encodeFunctionData(
    'withdraw',
    [ethers.utils.parseUnits(amount, decimal)]
  );
  return bridgeCallData;
}

export async function encodeExecuteCallData(dest: string[], func: string[]) {
  const simpleAccountInterface = new ethers.utils.Interface([
    'function executeBatch(address[] calldata dest, bytes[] calldata func) external',
  ]);
  return simpleAccountInterface.encodeFunctionData('executeBatch', [
    dest,
    func,
  ]);
}

export async function getNonceMemecore(walletAddr: string) {
  const accountContractMemecore = new ethers.Contract(
    walletAddr, // Contract address
    AbiSimpleAccount as ContractInterface, // ABI (ContractInterface)
    memecoreProvider // Provider
  );

  const codeMemecore = await memecoreProvider.getCode(walletAddr);
  if (codeMemecore != '0x') {
    return (await accountContractMemecore.getNonce()).toString();
  } else {
    return '0';
  }
}

export async function getNonceEthereum(walletAddr: string) {
  const accountContractEthereum = new ethers.Contract(
    walletAddr, // Contract address
    AbiSimpleAccount as ContractInterface, // ABI
    ethereumProvider // Provider
  );

  const codeEthereum = await ethereumProvider.getCode(walletAddr);
  if (codeEthereum != '0x') {
    return (await accountContractEthereum.getNonce()).toString();
  } else {
    return '0';
  }
}

export async function getNonceBase(walletAddr: string) {
  const accountContractBase = new ethers.Contract(
    walletAddr, // Contract address
    AbiSimpleAccount as ContractInterface, // ABI
    baseProvider // Provider
  );

  const codeBase = await baseProvider.getCode(walletAddr);
  if (codeBase != '0x') {
    return (await accountContractBase.getNonce()).toString();
  } else {
    return '0';
  }
}

export async function getHashByMemecore(userOp: { [key: string]: string }) {
  const entryPointContractMemecore = new ethers.Contract(
    '0x850f21dfd0864879cE133C67DE683bC5A5EbB265', // Contract address
    AbiEntrypoint as ContractInterface, // ABI
    memecoreProvider // Provider
  );
  return entryPointContractMemecore.getUserOpHash(userOp);
}

export async function getHashByEthereum(userOp: { [key: string]: string }) {
  const entryPointContractEthereum = new ethers.Contract(
    '0x850f21dfd0864879cE133C67DE683bC5A5EbB265', // Contract address
    AbiEntrypoint as ContractInterface, // ABI
    ethereumProvider // Provider
  );
  return entryPointContractEthereum.getUserOpHash(userOp);
}

export async function getAddressMemecore(owner: string) {
  const accountFactoryContractMemecore = new ethers.Contract(
    '0xBa21A3e9D5BfC29347E8d7b9DCff29dB3dB0B641', // Contract address
    AbiSimpleAccountFactory as ContractInterface, // ABI
    memecoreProvider // Provider
  );

  const walletAddr = await accountFactoryContractMemecore.getAddress(
    owner,
    saltNumber
  );
  return walletAddr;
}

export async function getBalance(
  walletAddr: string,
  tokenAddr: string,
  provider: ethers.providers.JsonRpcProvider,
  decimals: number = 6
) {
  const accountContractMemecore = new ethers.Contract(
    tokenAddr, // Contract address
    AbiErc20 as ContractInterface, // ABI (ContractInterface)
    provider // Provider
  );

  const codeMemecore = await provider.getCode(tokenAddr);
  if (codeMemecore != '0x') {
    return formatUnit(
      (await accountContractMemecore.balanceOf(walletAddr)).toString(),
      decimals
    ).toString();
  } else {
    return '0';
  }
}
export async function getBalanceMemecore(
  walletAddr: string,
  tokenAddr: string,
  decimals: number = 6
) {
  return getBalance(walletAddr, tokenAddr, memecoreProvider, decimals);
}
export async function getBalanceEthereum(
  walletAddr: string,
  tokenAddr: string,
  decimals: number = 6
) {
  return getBalance(walletAddr, tokenAddr, ethereumProvider, decimals);
}
export async function getBalanceBase(
  walletAddr: string,
  tokenAddr: string,
  decimals: number = 6
) {
  return getBalance(walletAddr, tokenAddr, baseProvider, decimals);
}
export async function getBalanceMemecoreOsyusd(walletAddr: string) {
  return getBalanceMemecore(walletAddr, TOKEN_ADDRESS_MEMECORE_OSYUSD, 6);
}
export async function getBalanceMemecoreUsdc(walletAddr: string) {
  return getBalanceMemecore(walletAddr, TOKEN_ADDRESS_MEMECORE_USDC, 6);
}
export async function getBalanceEthereumCusdc(walletAddr: string) {
  return getBalanceEthereum(walletAddr, TOKEN_ADDRESS_ETHEREUM_CUSDC, 6);
}
export async function getBalanceEthereumUsdc(walletAddr: string) {
  return getBalanceEthereum(walletAddr, TOKEN_ADDRESS_ETHEREUM_USDC, 6);
}
export async function getBalanceBaseCusdc(walletAddr: string) {
  return getBalanceBase(walletAddr, TOKEN_ADDRESS_BASE_CUSDC, 6);
}
export async function getBalanceBaseUsdc(walletAddr: string) {
  return getBalanceBase(walletAddr, TOKEN_ADDRESS_BASE_USDC, 6);
}

export async function getApr() {
  const accountContractMemecore = new ethers.Contract(
    '0x6D9FfE31dFc72E4fD486Db5701F82d76Ccb1c8Ea', // Contract address
    OmniVault as ContractInterface, // ABI (ContractInterface)
    memecoreProvider // Provider
  );

  return formatUnit(
    (await accountContractMemecore.getAPR()).toString(),
    16
  ).toString();
}

export async function createContractFromFile(
  contractAddress: string,
  provider: ethers.providers.JsonRpcProvider,
  contractInterface: ContractInterface
) {
  const abi = contractInterface;
  return new ethers.Contract(contractAddress, abi, provider);
}

export async function encodeCreateAccountCallDataByMemecore(
  owner: string,
  salt: number
) {
  const accountFactoryContract = new ethers.Contract(
    '0xBa21A3e9D5BfC29347E8d7b9DCff29dB3dB0B641', // Contract address
    AbiSimpleAccountFactory as ContractInterface, // ABI
    memecoreProvider // Provider
  );

  const walletAddr = await accountFactoryContract.getAddress(owner, salt);
  const accountFactory = await createContractFromFile(
    '0xBa21A3e9D5BfC29347E8d7b9DCff29dB3dB0B641',
    ethereumProvider,
    AbiSimpleAccountFactory as ContractInterface
  );
  const simpleAccountFactoryInterface = new ethers.utils.Interface(
    accountFactory.interface.format(ethers.utils.FormatTypes.json)
  );
  const createAccountCalldata =
    simpleAccountFactoryInterface.encodeFunctionData('createAccount', [
      owner,
      salt,
    ]);
  let addressAndCalldata =
    '0xBa21A3e9D5BfC29347E8d7b9DCff29dB3dB0B641' +
    createAccountCalldata.slice(2); // Remove '0x' from calldata

  const codeMemecore = await memecoreProvider.getCode(walletAddr);
  if (codeMemecore != '0x') {
    addressAndCalldata = '0x';
  }
  return { address: walletAddr, callData: addressAndCalldata };
}

export async function encodeCreateAccountCallDataByEthereum(
  owner: string,
  salt: number
) {
  const accountFactoryContract = new ethers.Contract(
    '0xBa21A3e9D5BfC29347E8d7b9DCff29dB3dB0B641', // Contract address
    AbiSimpleAccountFactory as ContractInterface, // ABI
    ethereumProvider // Provider
  );

  const walletAddr = await accountFactoryContract.getAddress(owner, salt);
  const accountFactory = await createContractFromFile(
    '0xBa21A3e9D5BfC29347E8d7b9DCff29dB3dB0B641',
    ethereumProvider,
    AbiSimpleAccountFactory as ContractInterface
  );
  const simpleAccountFactoryInterface = new ethers.utils.Interface(
    accountFactory.interface.format(ethers.utils.FormatTypes.json)
  );
  const createAccountCalldata =
    simpleAccountFactoryInterface.encodeFunctionData('createAccount', [
      owner,
      salt,
    ]);

  let addressAndCalldata =
    '0xBa21A3e9D5BfC29347E8d7b9DCff29dB3dB0B641' +
    createAccountCalldata.slice(2); // Remove '0x' from calldata
  const codeEthereum = await ethereumProvider.getCode(walletAddr);

  if (codeEthereum != '0x') {
    addressAndCalldata = '0x';
  }
  return { address: walletAddr, callData: addressAndCalldata };
}

export async function createUserOperationFormat() {
  const AddressZero = ethers.constants.AddressZero;
  return {
    sender: AddressZero,
    nonce: '0',
    initCode: '0x',
    callData: '0x',
    callGasLimit: '1000000', // Increased gas limit
    verificationGasLimit: '600000', // Increased verification gas limit
    preVerificationGas: '21000', // should also cover calldata cost.
    maxFeePerGas: '0',
    maxPriorityFeePerGas: '1000000000',
    paymasterAndData: '0x',
    signature: '0x',
  };
}

export async function getUserOpByMemecore(
  eoaAddr: string,
  callDataInfo: { dest: string; func: string }[]
) {
  const useropMemecore = await createUserOperationFormat();
  console.log('useropMemecore', useropMemecore);
  const accountInfo = await encodeCreateAccountCallDataByMemecore(
    eoaAddr,
    saltNumber
  );
  console.log('accountInfo', accountInfo);
  useropMemecore.initCode = accountInfo.callData;
  useropMemecore.sender = accountInfo.address;
  console.log(111);
  useropMemecore.nonce = await getNonceMemecore(accountInfo.address);
  console.log('useropMemecore.nonce', useropMemecore.nonce);
  console.log(222);
  if (callDataInfo.length > 0) {
    const dest = [];
    const func = [];
    for (let i = 0; i < callDataInfo.length; i++) {
      dest.push(callDataInfo[i].dest);
      func.push(callDataInfo[i].func);
    }
    useropMemecore.callData = await encodeExecuteCallData(dest, func);
    console.log('useropMemecore', useropMemecore);
    console.log(333);
  } else {
    useropMemecore.callData = '0x'; // CallData 넣기
  }
  const useropMemecoreHash = await getHashByMemecore(useropMemecore);

  return { userOp: useropMemecore, userOpByHash: useropMemecoreHash };
}

export function toEthSignedMessageHash(messageHash: string) {
  const prefix = '\x19Ethereum Signed Message:\n32';

  return ethers.utils.keccak256(
    ethers.utils.solidityPack(['string', 'bytes32'], [prefix, messageHash])
  );
}
