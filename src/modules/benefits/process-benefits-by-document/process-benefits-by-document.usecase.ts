import { Inject, Injectable } from '@nestjs/common';
import { ProcessBenefitsByDocumentDTO } from './process-benefits-by-document.dto';
import { ProcessDocumentsQueueService } from 'src/services/queue/queue.service';
import { ILogger } from 'src/shared/logger/logger.interface';

@Injectable()
export class ProcessBenefitsByDocumentUseCase {
  constructor(
    private readonly processDocumentsQueueService: ProcessDocumentsQueueService,
    @Inject('logger') private readonly logger: ILogger,
  ) {}

  /**
   * This method only will add an array of documents to the queue
   */
  async execute({ documents }: ProcessBenefitsByDocumentDTO) {
    if (!documents.length) return;

    try {
      await this.processDocumentsQueueService.add<string[]>(documents);
    } catch (error) {
      this.logger.error('Error adding documents to queue', error);
      throw error;
    }
  }
}
