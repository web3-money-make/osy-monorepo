import { BigNumberish } from 'ethers';

import { ResBaseDTO } from './resBaseDTO';

export class EstimateUserOpGasResDTO extends ResBaseDTO {
    public preVerificationGas: BigNumberish = 0;
    public verificationGas: BigNumberish = 0;
    public validAfter: BigNumberish = 0;
    public validUntil: BigNumberish = 0;
    public callGasLimit: BigNumberish = 0;
}