import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { LoggerService } from '../logger/logger.service';

@Module({
  imports: [ConfigModule],
  providers: [RedisService, LoggerService],
  exports: [RedisService],
})
export class RedisModule {}
