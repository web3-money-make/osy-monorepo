import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ethers } from 'ethers';
import { Rebalanced, RebalancedDocument } from '../schemas/rebalanced.schema';
import {
  UpdatedInterest,
  UpdatedInterestDocument,
} from '../schemas/updated-interest.schema';
import { SyncState, SyncStateDocument } from '../schemas/sync-state.schema';

const CONTRACT_ADDRESS = '0x6D9FfE31dFc72E4fD486Db5701F82d76Ccb1c8Ea';
const RPC_URL = 'https://rpc.insectarium.memecore.net';

// ABI for the events
const REBALANCED_ABI = [
  'event Rebalanced(uint256 indexed srcChainId, uint256 indexed dstChainId, uint256 amount)',
];

const UPDATED_INTEREST_ABI = [
  'event UpdatedInterest(uint256 indexed chainId, uint256 oldSupply, uint256 newSupply, uint256 oldAPR, uint256 newAPR)',
];

@Injectable()
export class EventSyncService {
  private readonly logger = new Logger(EventSyncService.name);
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor(
    @InjectModel(Rebalanced.name)
    private rebalancedModel: Model<RebalancedDocument>,
    @InjectModel(UpdatedInterest.name)
    private updatedInterestModel: Model<UpdatedInterestDocument>,
    @InjectModel(SyncState.name)
    private syncStateModel: Model<SyncStateDocument>,
  ) {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      [...REBALANCED_ABI, ...UPDATED_INTEREST_ABI],
      this.provider,
    );
  }

  async syncEvents(): Promise<void> {
    try {
      this.logger.log('Starting event sync...');

      // Get last synced block number
      const lastBlockNumber = await this.getLastBlockNumber();
      const currentBlockNumber = await this.provider.getBlockNumber();

      if (lastBlockNumber >= currentBlockNumber) {
        this.logger.log('No new blocks to sync');
        return;
      }

      // Sync from lastBlockNumber + 1 to current block
      const fromBlock = lastBlockNumber + 1;
      const toBlock = currentBlockNumber;

      this.logger.log(`Syncing blocks from ${fromBlock} to ${toBlock}...`);

      // Get Rebalanced events
      const rebalancedFilter = this.contract.filters.Rebalanced();
      const rebalancedEvents = await this.contract.queryFilter(
        rebalancedFilter,
        fromBlock,
        toBlock,
      );

      // Get UpdatedInterest events
      const updatedInterestFilter = this.contract.filters.UpdatedInterest();
      const updatedInterestEvents = await this.contract.queryFilter(
        updatedInterestFilter,
        fromBlock,
        toBlock,
      );

      // Save Rebalanced events
      for (const event of rebalancedEvents) {
        if (
          'args' in event &&
          event.args &&
          'transactionHash' in event &&
          'blockNumber' in event
        ) {
          const rebalanced = new this.rebalancedModel({
            srcChainId: event.args.srcChainId.toString(),
            dstChainId: event.args.dstChainId.toString(),
            amount: event.args.amount.toString(),
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
          });
          await rebalanced.save();
          this.logger.log(`Saved Rebalanced event: ${event.transactionHash}`);
        }
      }

      // Save UpdatedInterest events
      for (const event of updatedInterestEvents) {
        if (
          'args' in event &&
          event.args &&
          'transactionHash' in event &&
          'blockNumber' in event
        ) {
          // Convert APR from wei (10^18) to percentage format
          const oldAPRValue = ethers.formatUnits(event.args.oldAPR, 18);
          const newAPRValue = ethers.formatUnits(event.args.newAPR, 18);
          const oldAPR = (Number(oldAPRValue) * 100).toString();
          const newAPR = (Number(newAPRValue) * 100).toString();

          const updatedInterest = new this.updatedInterestModel({
            chainId: event.args.chainId.toString(),
            oldSupply: event.args.oldSupply.toString(),
            newSupply: event.args.newSupply.toString(),
            oldAPR: oldAPR,
            newAPR: newAPR,
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
          });
          await updatedInterest.save();
          this.logger.log(
            `Saved UpdatedInterest event: ${event.transactionHash}`,
          );
        }
      }

      // Update last synced block number
      await this.updateLastBlockNumber(toBlock);

      this.logger.log(
        `Sync completed. Processed ${rebalancedEvents.length} Rebalanced events and ${updatedInterestEvents.length} UpdatedInterest events`,
      );
    } catch (error) {
      this.logger.error(`Error syncing events: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getLastBlockNumber(): Promise<number> {
    const syncState = await this.syncStateModel.findOne({
      key: 'last_block',
    });

    if (!syncState) {
      // If no sync state exists, start from current block - 1000 (or 0 if current block is less than 1000)
      const currentBlock = await this.provider.getBlockNumber();
      const startBlock = Math.max(0, currentBlock - 1000);

      // Create initial sync state
      const newSyncState = new this.syncStateModel({
        key: 'last_block',
        lastBlockNumber: startBlock.toString(),
      });
      await newSyncState.save();

      return startBlock;
    }

    return parseInt(syncState.lastBlockNumber, 10);
  }

  private async updateLastBlockNumber(blockNumber: number): Promise<void> {
    const syncState = await this.syncStateModel.findOne({
      key: 'last_block',
    });

    if (!syncState) {
      const newSyncState = new this.syncStateModel({
        key: 'last_block',
        lastBlockNumber: blockNumber.toString(),
      });
      await newSyncState.save();
    } else {
      syncState.lastBlockNumber = blockNumber.toString();
      await syncState.save();
    }
  }
}
