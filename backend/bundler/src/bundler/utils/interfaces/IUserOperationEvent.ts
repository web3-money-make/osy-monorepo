import { BigNumberish } from 'ethers';

export interface IUserOperationEvent {
  userOpHash: string;
  sender: string;
  paymaster: string;
  nonce: BigNumberish;
  success: boolean;
  actualGasCost: BigNumberish;
  actualGasUsed: BigNumberish;
}