import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ESService } from './elasticsearch.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const config = {
          node: configService.getOrThrow('ELASTICSEARCH_NODE'),
          maxRetries: 10,
          requestTimeout: 60000,
          ssl: {
            rejectUnauthorized: false,
          },
        };
        return config;
      },
      inject: [ConfigService],
    }),
  ],
  providers: [ESService, LoggerService],
  exports: [ESService],
})
export class ElasticModule {}
