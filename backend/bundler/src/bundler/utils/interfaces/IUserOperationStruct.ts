import type { BigNumberish, BytesLike } from 'ethers';

export interface IUserOperationStruct {
  sender: string;
  nonce: BigNumberish;
  initCode: BytesLike;
  callData: BytesLike;
  callGasLimit: BigNumberish;
  verificationGasLimit: BigNumberish;
  preVerificationGas: BigNumberish;
  maxFeePerGas: BigNumberish;
  maxPriorityFeePerGas: BigNumberish;
  paymasterAndData: BytesLike;
  signature: BytesLike;
}

export class UserOperationStruct implements IUserOperationStruct {
  public sender: string = "";
  public nonce: BigNumberish = 0;
  public initCode: BytesLike = "";
  public callData: BytesLike = "";
  public callGasLimit: BigNumberish = 0;
  public verificationGasLimit: BigNumberish = 0;
  public preVerificationGas: BigNumberish = 0;
  public maxFeePerGas: BigNumberish = 0;
  public maxPriorityFeePerGas: BigNumberish = 0;
  public paymasterAndData: BytesLike = "";
  public signature: BytesLike = "";
}