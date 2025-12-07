import { TransactionReceipt } from 'ethers';

import { ResBaseDTO } from './resBaseDTO';

export class GetUserOpReceiptResDTO extends ResBaseDTO {
    public userOperationReceipt?: TransactionReceipt;
}