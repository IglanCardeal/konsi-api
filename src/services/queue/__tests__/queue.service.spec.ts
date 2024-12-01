import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bull';
import { QueueService } from '../queue.service';
import { CONSTANTS } from 'src/constants';
import { LoggerService } from 'src/services/logger/logger.service';

describe('QueueService', () => {
  let service: QueueService;
  let queue: Queue;
  let logger: LoggerService;

  beforeEach(async () => {
    const queueMock = {
      add: jest.fn(),
    };

    const loggerMock = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: `BullQueue_${CONSTANTS.queue.processDocumentsQueueName}`,
          useValue: queueMock,
        },
        {
          provide: LoggerService,
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    queue = module.get(
      `BullQueue_${CONSTANTS.queue.processDocumentsQueueName}`,
    );
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('add', () => {
    const testData = { test: 'data' };
    const JOB_NAME = CONSTANTS.queue.processDocumentsQueueJobName;

    it('should successfully add data to queue and log info', async () => {
      (queue.add as jest.Mock).mockResolvedValueOnce(undefined);

      await service.add(testData);

      expect(queue.add).toHaveBeenCalledWith(JOB_NAME, testData);
      expect(logger.info).toHaveBeenCalledWith(
        `[${QueueService.name}.add()] Added document to queue with success`,
        testData,
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle errors and log them', async () => {
      const error = new Error('Queue error');
      (queue.add as jest.Mock).mockRejectedValueOnce(error);

      await service.add(testData);

      expect(queue.add).toHaveBeenCalledWith(JOB_NAME, testData);
      expect(logger.error).toHaveBeenCalledWith(
        `[${QueueService.name}.add()] Error add data to queue`,
        error,
      );
      expect(logger.info).not.toHaveBeenCalled();
    });
  });
});
