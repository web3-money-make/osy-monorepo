import { BigNumberish } from 'ethers';

import { IStakeInfo } from './IStakeInfo';

export interface IValidationResult {
    returnInfo: {
        preOpGas: BigNumberish
        prefund: BigNumberish
        sigFailed: boolean
        deadline: number
    };

    senderInfo: IStakeInfo;
    factoryInfo?: IStakeInfo
    paymasterInfo?: IStakeInfo
}