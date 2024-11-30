import { Module } from '@nestjs/common';
import { BenefitsModule } from './modules/benefits/benefits.module';
import { QueueModule } from './services/queue/queue.module';
import { RedisModule } from './services/redis/redis.module';

@Module({
  imports: [BenefitsModule, QueueModule, RedisModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
