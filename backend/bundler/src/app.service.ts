import * as dotenv from 'dotenv';

import { Injectable } from '@nestjs/common';

import { Bundler } from './bundler';
import {
  EstimateUserOpGasReqDTO, EstimateUserOpGasResDTO, GetChainIdResDTO,
  GetSupportedEntryPointsResDTO, GetUserOpByHashResDTO, GetUserOpReceiptResDTO,
  GetUserOpReqDTO, SendUserOpReqDTO, SendUserOpResDTO
} from './bundler/dto';

@Injectable()
export class AppService {
    private bundler: Bundler;
    constructor() {
        dotenv.config();
        const providerUrl = process.env.PROVIDER_URL;
        const entryPointsContract = process.env.ENTRYPOINTS_CONTRACT;
        const privateKey = process.env.PRIVATE_KEY;

        if (!providerUrl || !entryPointsContract || !privateKey) {
          throw new Error('Missing environment variables');
        }
      
        this.bundler = new Bundler(providerUrl, entryPointsContract, privateKey);
    }

    public async getChainId(): Promise<GetChainIdResDTO> {
        const response: GetChainIdResDTO = new GetChainIdResDTO();
        response.chainId = Number(await this.bundler.getChainId());
        return response;
    }

    public async getSupportedEntryPoints(): Promise<GetSupportedEntryPointsResDTO> {
        const response: GetSupportedEntryPointsResDTO = new GetSupportedEntryPointsResDTO();
        response.entryPoints = await this.bundler.getSupportedEntryPoints();
        return response;
    }

    public async getUserOperationReceipt(reqDTO: GetUserOpReqDTO): Promise<GetUserOpReceiptResDTO> {
        const receipt = await this.bundler.getUserOperationReceipt(reqDTO.userOperationHash, reqDTO.fromBlock);
        const response: GetUserOpReceiptResDTO = new GetUserOpReceiptResDTO();
        response.userOperationReceipt = receipt ?? undefined;
        return response;
    }

    public async getUserOperationByHash(reqDTO: GetUserOpReqDTO): Promise<GetUserOpByHashResDTO> {
        return this.bundler.getUserOperationByHash(reqDTO.userOperationHash, reqDTO.fromBlock);
    }

    public async sendUserOperation(reqDTO: SendUserOpReqDTO): Promise<SendUserOpResDTO> {
        const response: SendUserOpResDTO = new SendUserOpResDTO();

        const bundleHash = await this.bundler.sendBundle(reqDTO.userOp);
        response.bundleHash = bundleHash;
        return response;
    }

    public async estimateUserOperationGas(reqDTO: EstimateUserOpGasReqDTO): Promise<EstimateUserOpGasResDTO> {
        const response: EstimateUserOpGasResDTO = new EstimateUserOpGasResDTO();
        const gas = await this.bundler.estimateUserOperationGas(reqDTO.mempoolUserOp.userOp, reqDTO.entryPointInput);
        response.preVerificationGas = gas.preVerificationGas;
        response.verificationGas = gas.verificationGas;
        response.callGasLimit = gas.callGasLimit;
        return response;
    }
}
