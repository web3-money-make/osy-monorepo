import { IMempoolUserOp, MempoolUserOp } from '../../utils';

export class EstimateUserOpGasReqDTO {
    public mempoolUserOp: IMempoolUserOp = new MempoolUserOp();
    public entryPointInput: string = '';
}