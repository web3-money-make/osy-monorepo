import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

import { IUserOperationStruct, UserOperationStruct } from '../../utils';

export class SendUserOpReqDTO {
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => UserOperationStruct)
    readonly userOp: IUserOperationStruct = new UserOperationStruct();

    @IsString()
    readonly entryPointInput: string = "";
}