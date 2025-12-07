import {
  Body, Controller, Get, Headers, HttpStatus, Param, Post, Res, ValidationPipe
} from '@nestjs/common';

import { AppService } from './app.service';
import {
  EstimateUserOpGasReqDTO, EstimateUserOpGasResDTO, GetUserOpByHashResDTO,
  GetUserOpReceiptResDTO, GetUserOpReqDTO, SendUserOpReqDTO, SendUserOpResDTO
} from './bundler/dto';
import { GetChainIdResDTO } from './bundler/dto/response/getChainIdResDTO';
import {
  GetSupportedEntryPointsResDTO
} from './bundler/dto/response/getSupportedEntryPointsResDTO';

@Controller('')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  public async getHello(): Promise<void> {
    return;
  }

  @Get('/chainId')
  async getChainId(): Promise<GetChainIdResDTO> {
    let res = new GetChainIdResDTO();
    try {
      res = await this.appService.getChainId();
    } catch (e) {
      res.success = false;
      res.message = (e as Error).message;
    }
    return res;
  }

  @Get('/supportedEntryPoints')
  async getSupportedEntryPoints(): Promise<GetSupportedEntryPointsResDTO> {
    let res = new GetSupportedEntryPointsResDTO();
    try {
      res = await this.appService.getSupportedEntryPoints();
    } catch (e) {
      res.success = false;
      res.message = (e as Error).message;
    }
    return res;
  }

  @Get('/getUserOperationReceipt/:userOperationHash/:fromBlock')
  async getUserOperationReceipt(@Param(ValidationPipe) reqDTO: GetUserOpReqDTO): Promise<GetUserOpReceiptResDTO> {
    let res = new GetUserOpReceiptResDTO();
    try {
      res = await this.appService.getUserOperationReceipt(reqDTO);
    } catch (e) {
      res.success = false;
      res.message = (e as Error).message;
    }
    return res;
  }

  @Get('/getUserOperationByHash/:userOperationHash/:fromBlock')
  async getUserOperationByHash(@Param(ValidationPipe) reqDTO: GetUserOpReqDTO): Promise<GetUserOpByHashResDTO> {
    let res = new GetUserOpByHashResDTO();
    try {
      res = await this.appService.getUserOperationByHash(reqDTO);
    } catch (e) {
      res.success = false;
      res.message = (e as Error).message;
    }
    return res;
  }

  @Post('/sendUserOperation')
  async sendUserOperation(@Body(ValidationPipe) reqDTO: SendUserOpReqDTO): Promise<SendUserOpResDTO> {
    let res = new SendUserOpResDTO();
    try {
      res = await this.appService.sendUserOperation(reqDTO);
    } catch (e) {
      res.success = false;
      res.message = (e as Error).message;
    }

    return res;
  }

  @Post('/estimateUserOperationGas')
  async estimateUserOperationGas(@Body() reqDTO: EstimateUserOpGasReqDTO): Promise<EstimateUserOpGasResDTO> {
    let res = new EstimateUserOpGasResDTO();
    try {
      res = await this.appService.estimateUserOperationGas(reqDTO);
    } catch (e) {
      res.success = false;
      res.message = (e as Error).message;
    }
    return res;
  }

}
