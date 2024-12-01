import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { QueueProcessor } from '../queue.processor';
import { RedisService } from 'src/services/redis/redis.service';
import { ESService } from 'src/services/elasticsearch/elasticsearch.service';
import { LoggerService } from 'src/services/logger/logger.service';
import { INSSService } from 'src/services/inss/inss.service';

describe('QueueProcessor', () => {
  let processor: QueueProcessor;

  const mockDocument = '12345678900';
  const mockBenefitsData = {
    cpf: mockDocument,
    benefitsData: [
      { id: 1, value: 1000 },
      { id: 2, value: 2000 },
    ],
  };

  const mockJob: Partial<Job<string>> = {
    data: mockDocument,
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockESService = {
    index: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  const mockINSSService = {
    getBenefitsData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueProcessor,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ESService,
          useValue: mockESService,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
        {
          provide: INSSService,
          useValue: mockINSSService,
        },
      ],
    }).compile();

    processor = module.get<QueueProcessor>(QueueProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleProcessBenefits', () => {
    it('should process document successfully when data is not cached', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockINSSService.getBenefitsData.mockResolvedValue(
        mockBenefitsData.benefitsData,
      );
      mockESService.index.mockResolvedValue(undefined);
      mockRedisService.set.mockResolvedValue(undefined);

      await processor.handleProcessBenefits(mockJob as Job<string>);

      expect(mockRedisService.get).toHaveBeenCalledWith(mockDocument);
      expect(mockINSSService.getBenefitsData).toHaveBeenCalledWith(
        mockDocument,
      );
      expect(mockESService.index).toHaveBeenCalledWith({
        cpf: mockDocument,
        benefitsData: mockBenefitsData.benefitsData,
      });
      expect(mockRedisService.set).toHaveBeenCalledWith(mockDocument, {
        cpf: mockDocument,
        benefitsData: mockBenefitsData.benefitsData,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        `[${QueueProcessor.name}.handleProcessBenefits()] Process document success`,
        { document: mockDocument },
      );
    });

    it('should skip processing when data is cached', async () => {
      mockRedisService.get.mockResolvedValue(mockBenefitsData);

      await processor.handleProcessBenefits(mockJob as Job<string>);

      expect(mockRedisService.get).toHaveBeenCalledWith(mockDocument);
      expect(mockINSSService.getBenefitsData).not.toHaveBeenCalled();
      expect(mockESService.index).not.toHaveBeenCalled();
      expect(mockRedisService.set).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        `[${QueueProcessor.name}.handleProcessBenefits()] Process document success`,
        { document: mockDocument },
      );
    });

    it('should handle INSS service errors', async () => {
      const mockError = new Error('INSS API Error');
      mockRedisService.get.mockResolvedValue(null);
      mockINSSService.getBenefitsData.mockRejectedValue(mockError);

      await processor.handleProcessBenefits(mockJob as Job<string>);

      expect(mockRedisService.get).toHaveBeenCalledWith(mockDocument);
      expect(mockINSSService.getBenefitsData).toHaveBeenCalledWith(
        mockDocument,
      );
      expect(mockESService.index).not.toHaveBeenCalled();
      expect(mockRedisService.set).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        `[${QueueProcessor.name}.handleProcessBenefits()] Error while processing document: ${mockDocument}`,
        mockError,
      );
    });

    it('should handle Redis service errors', async () => {
      const mockError = new Error('Redis Error');
      mockRedisService.get.mockRejectedValue(mockError);

      await processor.handleProcessBenefits(mockJob as Job<string>);

      expect(mockRedisService.get).toHaveBeenCalledWith(mockDocument);
      expect(mockINSSService.getBenefitsData).not.toHaveBeenCalled();
      expect(mockESService.index).not.toHaveBeenCalled();
      expect(mockRedisService.set).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        `[${QueueProcessor.name}.handleProcessBenefits()] Error while processing document: ${mockDocument}`,
        mockError,
      );
    });

    it('should handle Elasticsearch service errors', async () => {
      const mockError = new Error('Elasticsearch Error');
      mockRedisService.get.mockResolvedValue(null);
      mockINSSService.getBenefitsData.mockResolvedValue(
        mockBenefitsData.benefitsData,
      );
      mockESService.index.mockRejectedValue(mockError);

      await processor.handleProcessBenefits(mockJob as Job<string>);

      expect(mockRedisService.get).toHaveBeenCalledWith(mockDocument);
      expect(mockINSSService.getBenefitsData).toHaveBeenCalledWith(
        mockDocument,
      );
      expect(mockESService.index).toHaveBeenCalled();
      expect(mockRedisService.set).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        `[${QueueProcessor.name}.handleProcessBenefits()] Error while processing document: ${mockDocument}`,
        mockError,
      );
    });
  });
});
