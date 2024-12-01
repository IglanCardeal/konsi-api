import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConsultBenefitsUseCase } from '../consult-benefits.usecase';
import { ESService } from 'src/services/elasticsearch/elasticsearch.service';
import { ILogger } from 'src/shared/logger/logger.interface';

describe('ConsultBenefitsUseCase', () => {
  let useCase: ConsultBenefitsUseCase;
  let elasticsearchService: ESService;
  let logger: ILogger;

  const mockDocument = '12345678900';
  const mockBenefitData = {
    cpf: '12345678900',
    benefitsData: {
      benefit: 'test benefit',
      value: 1000,
    },
  };

  const mockElasticsearchService = {
    searchByDocument: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultBenefitsUseCase,
        {
          provide: ESService,
          useValue: mockElasticsearchService,
        },
        {
          provide: 'logger',
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<ConsultBenefitsUseCase>(ConsultBenefitsUseCase);
    elasticsearchService = module.get<ESService>(ESService);
    logger = module.get<ILogger>('logger');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return benefit data when found', async () => {
      mockElasticsearchService.searchByDocument.mockResolvedValue([
        mockBenefitData,
      ]);

      const result = await useCase.execute({ document: mockDocument });

      expect(result).toEqual(mockBenefitData);
      expect(elasticsearchService.searchByDocument).toHaveBeenCalledWith(
        mockDocument,
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when no benefits found', async () => {
      mockElasticsearchService.searchByDocument.mockResolvedValue([]);

      await expect(useCase.execute({ document: mockDocument })).rejects.toThrow(
        new NotFoundException(
          `Benefits not found for document ${mockDocument}. Try processing it before consulting or wait process to finish.`,
        ),
      );

      expect(elasticsearchService.searchByDocument).toHaveBeenCalledWith(
        mockDocument,
      );
      expect(logger.error).toHaveBeenCalledWith(
        `[ConsultBenefitsUseCase] Error while consult document`,
        expect.any(NotFoundException),
      );
    });

    it('should log and rethrow elasticsearch service errors', async () => {
      const mockError = new Error('Elasticsearch error');
      mockElasticsearchService.searchByDocument.mockRejectedValue(mockError);

      await expect(useCase.execute({ document: mockDocument })).rejects.toThrow(
        mockError,
      );

      expect(elasticsearchService.searchByDocument).toHaveBeenCalledWith(
        mockDocument,
      );
      expect(logger.error).toHaveBeenCalledWith(
        `[ConsultBenefitsUseCase] Error while consult document`,
        mockError,
      );
    });

    it('should handle invalid document format', async () => {
      const invalidDocument = '123';
      mockElasticsearchService.searchByDocument.mockResolvedValue([]);

      await expect(
        useCase.execute({ document: invalidDocument }),
      ).rejects.toThrow(NotFoundException);

      expect(elasticsearchService.searchByDocument).toHaveBeenCalledWith(
        invalidDocument,
      );
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return first result when multiple results found', async () => {
      const multipleResults = [
        { id: 1, data: 'first' },
        { id: 2, data: 'second' },
      ];
      mockElasticsearchService.searchByDocument.mockResolvedValue(
        multipleResults,
      );

      const result = await useCase.execute({ document: mockDocument });

      expect(result).toEqual(multipleResults[0]);
      expect(elasticsearchService.searchByDocument).toHaveBeenCalledWith(
        mockDocument,
      );
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});
