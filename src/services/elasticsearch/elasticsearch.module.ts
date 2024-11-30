import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ESService } from './elasticsearch.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
  providers: [ESService],
  exports: [ESService],
})
export class ElasticModule {}
