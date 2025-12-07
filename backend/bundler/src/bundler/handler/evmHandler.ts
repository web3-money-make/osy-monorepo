import { Contract, EventLog, JsonRpcProvider, toBeHex, Wallet } from 'ethers';

import {
  calcPreVerificationGas, getUserOperationEvent, HEX_REGEX, IGasOverheads,
  IUserOperationStruct, packUserOp, requireCond
} from '../utils';
import entryPointABI from './abi/entryPoint.abi.json';

export class EvmHandler {
  private signer: Wallet | null;
  private provider: JsonRpcProvider;
  private entryPoint: Contract;
  private entryPointAddress: string;

  constructor(
    providerUrl: string,
    entryPointAddress: string,
    privateKey: string | null
  ) {
    this.provider = new JsonRpcProvider(providerUrl);
    this.entryPointAddress = entryPointAddress;

    if(privateKey === null ){
      this.signer = null;

      this.entryPoint = new Contract(
        entryPointAddress,
        entryPointABI
      );
    } else {
      this.signer = new Wallet(privateKey, this.provider);

      this.entryPoint = new Contract(
        entryPointAddress,
        entryPointABI,
        this.signer
      );
    }
  }

  async getUserOperationByHash (userOpHash: string, fromBlock: number | undefined) {
    requireCond(userOpHash.match(HEX_REGEX) != null, 'Missing/invalid userOpHash', -32601)
    const event = (await getUserOperationEvent(
      this.getEntryPointContract(),
      fromBlock,
      undefined,
      userOpHash
    ))[0] as EventLog // EventLog or Log 인데, 타입 에러로 인하여 변경

    if (event == null) {
      return null
    }

    const tx = await event.getTransaction()
    if (tx.to !== this.getSupportedEntryPoints()) {
      throw new Error('unable to parse transaction')
    }
    const parsed = this.getEntryPointContract().interface.parseTransaction(tx)
    if (parsed == null) {
      throw new Error('failed to parse transaction')
    }
    const ops: IUserOperationStruct[] = parsed.args.ops
    if (ops == null) {
      throw new Error('failed to parse transaction')
    }

    // find sender, nonce same tx
    const op = ops.find(op =>
      op.sender === event['args'][1] && // sender
      op.nonce === event['args'][3] //nonce
    )
    if (op == null) {
      throw new Error('unable to find userOp in transaction')
    }

    const {
      sender,
      nonce,
      initCode,
      callData,
      callGasLimit,
      verificationGasLimit,
      preVerificationGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      paymasterAndData,
      signature
    } = op

    return this.deepHexlify({
      userOperation: {
        sender,
        nonce,
        initCode,
        callData,
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        paymasterAndData,
        signature
      },
      entryPoint: this.getSupportedEntryPoints(),
      transactionHash: tx.hash,
      blockHash: tx.blockHash ?? '',
      blockNumber: tx.blockNumber ?? 0
    })
  }

  async getUserOperationReceipt (userOpHash: string, fromBlock: number | undefined) {
    requireCond(userOpHash.match(HEX_REGEX) != null, 'Missing/invalid userOpHash', -32601)
    const event = (await getUserOperationEvent(
      this.getEntryPointContract(),
      fromBlock,
      undefined,
      userOpHash
    ))[0];

    if (event == null) {
      return null
    }
    const receipt = await event.getTransactionReceipt()

    return receipt;
  }

  public getProvider(): JsonRpcProvider {
    return this.provider;
  }

  public getEntryPointContract(): Contract {
    return this.entryPoint;
  }

  public async getChainId(): Promise<bigint> {
    const chainId = (await this.provider.getNetwork()).chainId;
    return chainId;
  }

  public getSupportedEntryPoints(): string {
    return this.entryPointAddress;
  }

  public getSigner(): Wallet | null{
    return this.signer;
  }

  public calcPreVerificationGas(
    userOp: Partial<IUserOperationStruct>,
    overheads?: Partial<IGasOverheads>,
  ): number {
    return calcPreVerificationGas(userOp, overheads);
  }

  public packUserOp(op: IUserOperationStruct, forSignature = true): string {
    return packUserOp(op, forSignature);
  }

  public deepHexlify(obj: any): any {
    if (typeof obj === 'function') {
      return undefined;
    }
    if (obj == null || typeof obj === 'string' || typeof obj === 'boolean') {
      return obj;
    } else if (obj._isBigNumber != null || typeof obj !== 'object') {
      return toBeHex(obj).replace(/^0x0/, '0x');
    }
    if (Array.isArray(obj)) {
      return obj.map((member) => this.deepHexlify(member));
    }
    return Object.keys(obj).reduce(
      (set, key) => ({
        ...set,
        [key]: this.deepHexlify(obj[key]),
      }),
      {},
    );
  }
}