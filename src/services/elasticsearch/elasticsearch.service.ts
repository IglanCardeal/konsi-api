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
      if (error.meta?.body?.error?.type === 'index_not_found_exception')
        return [];
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
      await this.elasticsearchService.update({
        index: CONSTANTS.elasticsearch.benefitsIndex,
        id: cpf,
        body: {
          doc: {
            cpf,
            benefitsData,
          },
          doc_as_upsert: true,
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
