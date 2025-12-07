import { IUserOperationStruct, UserOperationStruct } from '../../utils';
import { ResBaseDTO } from './resBaseDTO';

export class GetUserOpByHashResDTO extends ResBaseDTO {
    public userOperation: IUserOperationStruct = new UserOperationStruct();
    public entryPointInput: string = "";
    public blockHash: string = "";
    public blockNumber: number = 0;
}