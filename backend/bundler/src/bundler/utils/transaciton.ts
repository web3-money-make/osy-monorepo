import {
  AbiCoder, BigNumberish, Contract, EventLog, getBytes, hexlify, keccak256, Log
} from 'ethers';

import { IGasOverheads, IUserOperationStruct } from './interfaces';

  /**
   * Encode transaction data with AA Wallet
   * @param accountAddress AA Wallet address
   * @param target target contract address
   * @param value value
   * @param data transaction data
   */
  export async function encodeExecute(
    accountAddress: string,
    target: string,
    value: BigNumberish,
    data: string,
  ): Promise<string> {
    const accountContract = new Contract(accountAddress, [
      'function execute(address dest, uint256 value, bytes calldata func) external',
    ]);
    return accountContract.interface.encodeFunctionData('execute', [
      target,
      value,
      data,
    ]);
  }

  export function calcPreVerificationGas(
    userOp: Partial<IUserOperationStruct>,
    overheads?: Partial<IGasOverheads>,
  ): number {
    const DefaultGasOverheads: IGasOverheads = {
      fixed: 21000,
      perUserOp: 18300,
      perUserOpWord: 4,
      zeroByte: 4,
      nonZeroByte: 16,
      bundleSize: 1,
      sigSize: 65,
    };

    const ov = { ...DefaultGasOverheads, ...(overheads ?? {}) };
    const p: IUserOperationStruct = {
      // dummy values, in case the UserOp is incomplete.
      preVerificationGas: 21000, // dummy value, just for calldata cost
      signature: hexlify(Buffer.alloc(ov.sigSize, 1)), // dummy signature
      ...userOp,
    } as any;

    const packed = getBytes(packUserOp(p, false));
    const lengthInWord = (packed.length + 31) / 32;
    const callDataCost = packed
      .map((x) => (x === 0 ? ov.zeroByte : ov.nonZeroByte))
      .reduce((sum, x) => sum + x);
    const ret = Math.round(
      callDataCost +
        ov.fixed / ov.bundleSize +
        ov.perUserOp +
        ov.perUserOpWord * lengthInWord,
    );
    return ret;
  }

  export function packUserOp(
    op: IUserOperationStruct,
    forSignature = true,
  ): string {
    if (forSignature) {
      return AbiCoder.defaultAbiCoder().encode(
        [
          'address',
          'uint256',
          'bytes32',
          'bytes32',
          'uint256',
          'uint256',
          'uint256',
          'uint256',
          'uint256',
          'bytes32',
        ],
        [
          op.sender,
          op.nonce,
          keccak256(op.initCode),
          keccak256(op.callData),
          op.callGasLimit,
          op.verificationGasLimit,
          op.preVerificationGas,
          op.maxFeePerGas,
          op.maxPriorityFeePerGas,
          keccak256(op.paymasterAndData),
        ],
      );
    } else {
      // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
      return AbiCoder.defaultAbiCoder().encode(
        [
          'address',
          'uint256',
          'bytes',
          'bytes',
          'uint256',
          'uint256',
          'uint256',
          'uint256',
          'uint256',
          'bytes',
          'bytes',
        ],
        [
          op.sender,
          op.nonce,
          op.initCode,
          op.callData,
          op.callGasLimit,
          op.verificationGasLimit,
          op.preVerificationGas,
          op.maxFeePerGas,
          op.maxPriorityFeePerGas,
          op.paymasterAndData,
          op.signature,
        ],
      );
    }
  }

  export async function getUserOpReceipt(
    entryPointContract: Contract,
    userOpHash: string,
    fromBlock: number | undefined,
    toBlock: number | undefined
  ): Promise<string | null> {
    const events = await getUserOperationEvent(entryPointContract, fromBlock, toBlock, userOpHash);
    if (events.length > 0) {
      return events[0].transactionHash;
    }
    return null;
  }

  export async function getUserOperationEvent(
    entryPointContract: Contract,
    fromBlock: number | undefined,
    toBlock: number | undefined,
    userOpHash: string | undefined
  ) {
    let events: (EventLog | Log)[];
    if (userOpHash) {
      events = (await entryPointContract.queryFilter(
        entryPointContract.filters.UserOperationEvent(userOpHash),
        fromBlock,
        toBlock
      ))
    } else {
      events = (await entryPointContract.queryFilter(
        entryPointContract.filters.UserOperationEvent(),
        fromBlock,
        toBlock
      ))
    }

    return events;
  }