import { Inject, Injectable } from '@nestjs/common';
import { ProcessBenefitsByDocumentDTO } from './process-benefits-by-document.dto';
import { QueueService } from 'src/services/queue/queue.service';
import { ILogger } from 'src/shared/logger/logger.interface';

@Injectable()
export class ProcessBenefitsByDocumentUseCase {
  constructor(
    private readonly processDocumentsQueueService: QueueService,
    @Inject('logger') private readonly logger: ILogger,
  ) {}

  async execute({ documents }: ProcessBenefitsByDocumentDTO) {
    if (!documents.length) return;

    try {
      await Promise.all(
        documents.map((document) =>
          this.processDocumentsQueueService.add<string>(document),
        ),
      );
    } catch (error) {
      this.logger.error(
        `[${ProcessBenefitsByDocumentUseCase.name}] Error adding documents to queue`,
        error,
      );
      throw error;
    }
  }
}
