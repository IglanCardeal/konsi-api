import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CONSTANTS } from 'src/constants';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(CONSTANTS.queue.processDocumentsQueueName)
    private queue: Queue,
    private readonly logger: LoggerService,
  ) {}

  async add<T>(data: T): Promise<void> {
    try {
      const JOB_NAME = CONSTANTS.queue.processDocumentsQueueJobName;
      await this.queue.add(JOB_NAME, data);
      this.logger.info(
        `[${QueueService.name}.add()] Added data to queue with success`,
        data,
      );
    } catch (error) {
      this.logger.error(
        `[${QueueService.name}.add()] Error add data to queue`,
        error,
      );
    }
  }
}
