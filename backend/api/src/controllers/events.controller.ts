import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { EventsService } from '../services/events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('rebalanced')
  @ApiOperation({ summary: 'Rebalanced 이벤트 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Rebalanced 이벤트 목록을 반환합니다.',
  })
  async getRebalanced(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.eventsService.getAllRebalanced(page, limit);
  }

  @Get('rebalanced/:txHash')
  @ApiOperation({ summary: '트랜잭션 해시로 Rebalanced 이벤트 조회' })
  @ApiParam({ name: 'txHash', description: '트랜잭션 해시' })
  @ApiResponse({
    status: 200,
    description: '특정 트랜잭션의 Rebalanced 이벤트를 반환합니다.',
  })
  async getRebalancedByTxHash(@Param('txHash') txHash: string) {
    return this.eventsService.getRebalancedByTxHash(txHash);
  }

  @Get('updated-interest')
  @ApiOperation({ summary: 'UpdatedInterest 이벤트 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'UpdatedInterest 이벤트 목록을 반환합니다.',
  })
  async getUpdatedInterest(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.eventsService.getAllUpdatedInterest(page, limit);
  }

  @Get('updated-interest/:txHash')
  @ApiOperation({ summary: '트랜잭션 해시로 UpdatedInterest 이벤트 조회' })
  @ApiParam({ name: 'txHash', description: '트랜잭션 해시' })
  @ApiResponse({
    status: 200,
    description: '특정 트랜잭션의 UpdatedInterest 이벤트를 반환합니다.',
  })
  async getUpdatedInterestByTxHash(@Param('txHash') txHash: string) {
    return this.eventsService.getUpdatedInterestByTxHash(txHash);
  }

  @Get('updated-interest/latest/all')
  @ApiOperation({
    summary: '모든 chainId별 최신 UpdatedInterest 이벤트 조회',
  })
  @ApiResponse({
    status: 200,
    description: '각 chainId별로 가장 최신 UpdatedInterest 이벤트를 반환합니다.',
  })
  async getAllLatestUpdatedInterest() {
    return this.eventsService.getAllLatestUpdatedInterest();
  }

  @Get('updated-interest/latest/:chainId')
  @ApiOperation({
    summary: '특정 chainId의 최신 UpdatedInterest 이벤트 조회',
  })
  @ApiParam({ name: 'chainId', description: '체인 ID' })
  @ApiResponse({
    status: 200,
    description: '특정 chainId의 가장 최신 UpdatedInterest 이벤트를 반환합니다.',
  })
  async getLatestUpdatedInterestByChainId(@Param('chainId') chainId: string) {
    return this.eventsService.getLatestUpdatedInterestByChainId(chainId);
  }
}
