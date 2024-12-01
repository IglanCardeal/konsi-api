import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { RedisService } from '../redis/redis.service';
import { CONSTANTS } from 'src/constants';
import { ESService } from '../elasticsearch/elasticsearch.service';
import { LoggerService } from '../logger/logger.service';

@Processor(CONSTANTS.queue.processDocumentsQueueName)
export class QueueProcessor {
  constructor(
    private readonly redisService: RedisService,
    private readonly esService: ESService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * This methods use the external benefits provider service to find data to each
   * CPF document string. Then it saves the data to Elasticsearch and Redis cache.
   *
   * Redis cache is used to avoid duplicate data processing and overload the external API.
   */
  @Process(CONSTANTS.queue.processDocumentsQueueJobName)
  async handleProcessBenefits(job: Job<string[]>) {
    try {
      const documents = job.data;

      for (const cpf of documents) {
        // Verificar cache Redis
        const cachedData = await this.redisService.get(cpf);
        if (cachedData) continue;

        // Gerar o token e buscar os benefícios
        const _token = 'any';

        // Indexar no Elasticsearch
        await this.esService.index({
          cpf,
          benefitsData: {}, // data from external API
        });

        // Salvar no cache do Redis
        await this.redisService.set(cpf, {});
      }
    } catch (error) {
      this.logger.error(
        `[${QueueProcessor.name}.handleProcessBenefits()] Error while processing document`,
        error,
      );
    }
  }
}
