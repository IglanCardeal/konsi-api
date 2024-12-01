import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { RedisService } from '../redis/redis.service';
import { CONSTANTS } from 'src/constants';
import { ESService } from '../elasticsearch/elasticsearch.service';
import { LoggerService } from '../logger/logger.service';
import { INSSService } from '../inss/inss.service';

@Processor(CONSTANTS.queue.processDocumentsQueueName)
export class QueueProcessor {
  constructor(
    private readonly redisService: RedisService,
    private readonly esService: ESService,
    private readonly logger: LoggerService,
    private readonly inssService: INSSService,
  ) {}

  /**
   * This methods use the external benefits provider service to find data to each
   * CPF document string. Then it saves the data to Elasticsearch and Redis cache.
   *
   * Redis cache is used to avoid duplicate data processing and overload the external API.
   */
  @Process(CONSTANTS.queue.processDocumentsQueueJobName)
  async handleProcessBenefits(job: Job<string[]>) {
    const documents = job.data;

    try {
      this.logger.info(
        `[${QueueProcessor.name}.handleProcessBenefits()] Starting process documents`,
        { documents },
      );

      for (const cpf of documents) {
        const cachedData = await this.redisService.get(cpf);
        if (cachedData) continue;

        const benefitsData = await this.inssService.getBenefitsData(cpf);
        const data = {
          cpf,
          benefitsData,
        };

        await this.esService.index(data);

        await this.redisService.set(cpf, data);
      }

      this.logger.info(
        `[${QueueProcessor.name}.handleProcessBenefits()] Process documents success`,
        { documents },
      );
    } catch (error) {
      this.logger.error(
        `[${QueueProcessor.name}.handleProcessBenefits()] Error while processing documents: ${documents.join(', ')}`,
        error,
      );
    }
  }
}
