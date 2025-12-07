import type { BigNumberish } from "ethers";
import { IStakeInfo, StakeInfo } from './IStakeInfo';
import {
  IUserOperationStruct, UserOperationStruct
} from './IUserOperationStruct';

export interface IMempoolUserOp {
  userOp: IUserOperationStruct;
  userOpHash: string;
  prefund: BigNumberish;
  senderInfo: IStakeInfo;
};

export class MempoolUserOp implements IMempoolUserOp {
  userOp: UserOperationStruct = new UserOperationStruct();
  userOpHash: string = "";
  prefund: BigNumberish = 0;
  senderInfo: IStakeInfo = new StakeInfo();
}