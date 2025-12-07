import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventSyncService } from '../services/event-sync.service';

@Injectable()
export class EventSyncTask {
  private readonly logger = new Logger(EventSyncTask.name);

  constructor(private readonly eventSyncService: EventSyncService) {}

  @Cron('*/10 * * * * *') // Every 10 seconds
  async handleEventSync() {
    this.logger.log('Running event sync task...');
    try {
      await this.eventSyncService.syncEvents();
    } catch (error) {
      this.logger.error(
        `Event sync task failed: ${error.message}`,
        error.stack,
      );
    }
  }
}
