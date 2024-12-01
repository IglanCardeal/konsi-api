import { Injectable } from '@nestjs/common';
import { RedisClientType, createClient } from 'redis';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class RedisService {
  private client: RedisClientType;
  private readonly cacheExpiration: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    const host = this.configService.getOrThrow<string>('REDIS_HOST');
    const port = this.configService.getOrThrow<number>('REDIS_PORT');
    const redisConfig: any = {
      url: `redis://${host}:${port}`,
    };
    const ONE_HOUR = 3600;
    this.client = createClient(redisConfig);
    this.cacheExpiration =
      this.configService.get<number>('REDIS_CACHE_TTL') || ONE_HOUR;
    this.client.on('error', (err) => {
      this.logger.error(`[${RedisService.name}] Redis Client Error:`, err);
    });
    this.client.connect().catch((err) => {
      this.logger.error(`[${RedisService.name}] Redis Connection Error:`, err);
    });
  }

  async get(key: string): Promise<any> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`[${RedisService.name}] Redis Get Error:`, error);
      throw error;
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), {
        EX: this.cacheExpiration,
      });
    } catch (error) {
      this.logger.error(`[${RedisService.name}] Redis Set Error:`, error);
      throw error;
    }
  }
}
