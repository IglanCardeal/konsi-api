import { Test, TestingModule } from '@nestjs/testing';
import { ProcessBenefitsByDocumentUseCase } from '../process-benefits-by-document.usecase';
import { ProcessDocumentsQueueService } from 'src/services/queue/queue.service';
import { ILogger } from 'src/shared/logger/logger.interface';

describe('ProcessBenefitsByDocumentUseCase', () => {
  let useCase: ProcessBenefitsByDocumentUseCase;
  let queueService: ProcessDocumentsQueueService;
  let logger: ILogger;

  const mockQueueService = {
    add: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessBenefitsByDocumentUseCase,
        {
          provide: ProcessDocumentsQueueService,
          useValue: mockQueueService,
        },
        {
          provide: 'logger',
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<ProcessBenefitsByDocumentUseCase>(
      ProcessBenefitsByDocumentUseCase,
    );
    queueService = module.get<ProcessDocumentsQueueService>(
      ProcessDocumentsQueueService,
    );
    logger = module.get<ILogger>('logger');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const documents = ['any_cpf1', 'any_cpf2', 'any_cpf13'];

    it('should successfully add documents to queue', async () => {
      await useCase.execute({ documents });

      expect(queueService.add).toHaveBeenCalledTimes(1);
      expect(queueService.add).toHaveBeenCalledWith(documents);
    });

    it('should not call queue service when documents array is empty', async () => {
      await useCase.execute({ documents: [] });

      expect(queueService.add).not.toHaveBeenCalled();
    });

    it('should log error and rethrow when queue service throws', async () => {
      const error = new Error('Queue error');
      mockQueueService.add.mockRejectedValueOnce(error);

      await expect(useCase.execute({ documents })).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        'Error adding documents to queue',
        error,
      );
      expect(queueService.add).toHaveBeenCalledWith(documents);
    });
  });
});
