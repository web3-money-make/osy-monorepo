import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UpdatedInterestDocument = UpdatedInterest & Document;

@Schema({ timestamps: true })
export class UpdatedInterest {
  @Prop({ required: true })
  chainId: string;

  @Prop({ required: true })
  oldSupply: string;

  @Prop({ required: true })
  newSupply: string;

  @Prop({ required: true })
  oldAPR: string;

  @Prop({ required: true })
  newAPR: string;

  @Prop({ required: true })
  txHash: string;

  @Prop({ required: true })
  blockNumber: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UpdatedInterestSchema =
  SchemaFactory.createForClass(UpdatedInterest);
