import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetUserOpReqDTO {
    @IsNotEmpty()
    @IsString()
    readonly userOperationHash: string = "";

    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    readonly fromBlock: number = 0;
}