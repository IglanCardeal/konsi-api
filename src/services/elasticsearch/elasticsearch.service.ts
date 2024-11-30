import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { CONSTANTS } from 'src/constants';

@Injectable()
export class ESService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async searchByDocument(cpf: string) {
    const { hits } = await this.elasticsearchService.search({
      index: CONSTANTS.elasticsearch.benefitsIndex,
      body: {
        query: {
          match: { cpf },
        },
      },
    });
    return hits.hits.map((hit) => hit._source);
  }

  async index<T>({
    cpf,
    benefitsData,
  }: {
    cpf: string;
    benefitsData: T;
  }): Promise<void> {
    await this.elasticsearchService.index({
      index: CONSTANTS.elasticsearch.benefitsIndex,
      body: {
        cpf,
        benefitsData,
      },
    });
  }
}
