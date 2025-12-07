import { BigNumberish } from 'ethers';

export interface IStakeInfo {
    addr: string | undefined
    stake: BigNumberish
    unstakeDelaySec: BigNumberish
}

export class StakeInfo implements IStakeInfo {
    addr: string | undefined = "";
    stake: BigNumberish = 0;
    unstakeDelaySec: BigNumberish = 0;
}