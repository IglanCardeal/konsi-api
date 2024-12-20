import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { RedisService } from '../redis/redis.service';
import { CONSTANTS } from 'src/constants';
import { ESService } from '../elasticsearch/elasticsearch.service';
import { LoggerService } from '../logger/logger.service';
import { INSSService } from '../inss/inss.service';
import { BenefitsApiResponseMapped } from '../inss/inss.dto';

@Processor(CONSTANTS.queue.processDocumentsQueueName)
export class QueueProcessor {
  constructor(
    private readonly redisService: RedisService,
    private readonly esService: ESService,
    private readonly logger: LoggerService,
    private readonly inssService: INSSService,
  ) {}

  @Process(CONSTANTS.queue.processDocumentsQueueJobName)
  async handleProcessBenefits(job: Job<string>) {
    const document = job.data;

    try {
      await this.searchBenefitsByDocument(document);

      this.logger.info(
        `[${QueueProcessor.name}.handleProcessBenefits()] Process document success`,
        { document },
      );
    } catch (error) {
      this.logger.error(
        `[${QueueProcessor.name}.handleProcessBenefits()] Error while processing document: ${document}`,
        error,
      );
    }
  }

  private async searchBenefitsByDocument(cpf: string) {
    const cachedData = await this.redisService.get(cpf);
    if (cachedData) return;

    const benefitsData = await this.inssService.getBenefitsData(cpf);

    await this.saveDataByDocument(cpf, benefitsData);
  }

  private async saveDataByDocument(
    cpf: string,
    benefitsData: BenefitsApiResponseMapped[],
  ) {
    const data = { cpf, benefitsData };
    await this.esService.index(data);
    await this.redisService.set(cpf, data);
  }
}
