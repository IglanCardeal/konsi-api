import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { CONSTANTS } from 'src/constants';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class ESService {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly logger: LoggerService,
  ) {}

  async searchByDocument(cpf: string) {
    try {
      const { hits } = await this.elasticsearchService.search({
        index: CONSTANTS.elasticsearch.benefitsIndex,
        body: {
          query: {
            match: { cpf },
          },
        },
      });
      return hits.hits.map((hit) => hit._source);
    } catch (error) {
      this.logger.error(
        `[${ESService.name}.searchByDocument()] Error searching document data`,
        error,
      );
      throw error;
    }
  }

  async index<T>({
    cpf,
    benefitsData,
  }: {
    cpf: string;
    benefitsData: T;
  }): Promise<void> {
    try {
      await this.elasticsearchService.index({
        index: CONSTANTS.elasticsearch.benefitsIndex,
        body: {
          cpf,
          benefitsData,
        },
      });
    } catch (error) {
      this.logger.error(
        `[${ESService.name}.index()] Error indexing document data`,
        error,
      );
      throw error;
    }
  }
}
