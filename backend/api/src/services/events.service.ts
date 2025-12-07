import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rebalanced, RebalancedDocument } from '../schemas/rebalanced.schema';
import {
  UpdatedInterest,
  UpdatedInterestDocument,
} from '../schemas/updated-interest.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Rebalanced.name)
    private rebalancedModel: Model<RebalancedDocument>,
    @InjectModel(UpdatedInterest.name)
    private updatedInterestModel: Model<UpdatedInterestDocument>,
  ) {}

  async getAllRebalanced(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: RebalancedDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.rebalancedModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.rebalancedModel.countDocuments().exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getAllUpdatedInterest(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: UpdatedInterestDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.updatedInterestModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.updatedInterestModel.countDocuments().exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getRebalancedByTxHash(
    txHash: string,
  ): Promise<RebalancedDocument | null> {
    return this.rebalancedModel.findOne({ txHash }).exec();
  }

  async getUpdatedInterestByTxHash(
    txHash: string,
  ): Promise<UpdatedInterestDocument | null> {
    return this.updatedInterestModel.findOne({ txHash }).exec();
  }

  async getLatestUpdatedInterestByChainId(
    chainId: string,
  ): Promise<UpdatedInterestDocument | null> {
    return this.updatedInterestModel
      .findOne({ chainId })
      .sort({ blockNumber: -1 })
      .exec();
  }

  async getAllLatestUpdatedInterest(): Promise<
    UpdatedInterestDocument[]
  > {
    // MongoDB aggregation을 사용하여 chainId별로 블록 넘버가 가장 높은 데이터만 조회
    const result = await this.updatedInterestModel.aggregate([
      {
        $sort: { blockNumber: -1 },
      },
      {
        $group: {
          _id: '$chainId',
          doc: { $first: '$$ROOT' },
        },
      },
      {
        $replaceRoot: { newRoot: '$doc' },
      },
      {
        $sort: { chainId: 1 },
      },
    ]);

    return result;
  }
}
