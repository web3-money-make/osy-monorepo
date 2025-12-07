import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Rebalanced, RebalancedSchema } from './schemas/rebalanced.schema';
import {
  UpdatedInterest,
  UpdatedInterestSchema,
} from './schemas/updated-interest.schema';
import { SyncState, SyncStateSchema } from './schemas/sync-state.schema';
import { EventSyncService } from './services/event-sync.service';
import { EventsService } from './services/events.service';
import { EventSyncTask } from './tasks/event-sync.task';
import { EventsController } from './controllers/events.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/blockchain-events',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Rebalanced.name, schema: RebalancedSchema },
      { name: UpdatedInterest.name, schema: UpdatedInterestSchema },
      { name: SyncState.name, schema: SyncStateSchema },
    ]),
  ],
  controllers: [AppController, EventsController],
  providers: [AppService, EventSyncService, EventsService, EventSyncTask],
})
export class AppModule {}
