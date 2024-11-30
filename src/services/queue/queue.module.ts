import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { CONSTANTS } from 'src/constants';
import { QueueProcessor } from './queue.processor';
import { RedisModule } from '../redis/redis.module';
import { ElasticModule } from '../elasticsearch/elasticsearch.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.getOrThrow('REDIS_HOST'),
          port: configService.getOrThrow('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: CONSTANTS.queue.processDocumentsQueueName,
    }),
    RedisModule,
    ElasticModule,
  ],
  providers: [QueueService, QueueProcessor, RedisService],
  exports: [QueueService],
})
export class QueueModule {}
