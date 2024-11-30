import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CONSTANTS } from 'src/constants';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(CONSTANTS.queue.processDocumentsQueueName)
    private queue: Queue,
  ) {}

  async add<T>(data: T): Promise<void> {
    const JOB_NAME = CONSTANTS.queue.processDocumentsQueueJobName;
    await this.queue.add(JOB_NAME, data);
  }
}
