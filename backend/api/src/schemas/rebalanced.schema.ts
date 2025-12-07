import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RebalancedDocument = Rebalanced & Document;

@Schema({ timestamps: true })
export class Rebalanced {
  @Prop({ required: true })
  srcChainId: string;

  @Prop({ required: true })
  dstChainId: string;

  @Prop({ required: true })
  amount: string;

  @Prop({ required: true })
  txHash: string;

  @Prop({ required: true })
  blockNumber: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RebalancedSchema = SchemaFactory.createForClass(Rebalanced);
