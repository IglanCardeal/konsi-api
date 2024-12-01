import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ESService } from 'src/services/elasticsearch/elasticsearch.service';
import { ConsultBenefitsDTO } from './consult-benefits.dto';
import { ILogger } from 'src/shared/logger/logger.interface';

@Injectable()
export class ConsultBenefitsUseCase {
  constructor(
    private readonly elasticsearchService: ESService,
    @Inject('logger') private readonly logger: ILogger,
  ) {}

  async execute({ document }: ConsultBenefitsDTO) {
    try {
      const data = await this.elasticsearchService.searchByDocument(document);
      if (!data.length)
        throw new NotFoundException(
          `Benefits not found for document ${document}. Try processing it before consulting or wait process to finish.`,
        );
      return data[0];
    } catch (error) {
      this.logger.error(
        `[${ConsultBenefitsUseCase.name}] Error while consult document`,
        error,
      );
      throw error;
    }
  }
}
