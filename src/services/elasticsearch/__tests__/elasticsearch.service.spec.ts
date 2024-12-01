import { Test, TestingModule } from '@nestjs/testing';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ESService } from '../elasticsearch.service';
import { CONSTANTS } from 'src/constants';
import { LoggerService } from 'src/services/logger/logger.service';

describe('ESService', () => {
  let service: ESService;
  let elasticsearchService: ElasticsearchService;
  let logger: LoggerService;

  const mockCpf = '12345678900';
  const mockBenefitsData = {
    benefit: 'some benefit',
    value: 1000,
  };
  const mockSearchResponse = {
    hits: {
      hits: [
        {
          _source: {
            cpf: mockCpf,
            benefitsData: mockBenefitsData,
          },
        },
      ],
    },
  };
  const mockElasticsearchService = {
    search: jest.fn(),
    update: jest.fn(),
  };
  const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ESService,
        {
          provide: ElasticsearchService,
          useValue: mockElasticsearchService,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ESService>(ESService);
    elasticsearchService =
      module.get<ElasticsearchService>(ElasticsearchService);
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchByDocument', () => {
    it('should search documents by CPF and return mapped results', async () => {
      mockElasticsearchService.search.mockResolvedValueOnce(mockSearchResponse);

      const result = await service.searchByDocument(mockCpf);

      expect(elasticsearchService.search).toHaveBeenCalledWith({
        index: CONSTANTS.elasticsearch.benefitsIndex,
        body: {
          query: {
            match: { cpf: mockCpf },
          },
        },
      });
      expect(result).toEqual([mockSearchResponse.hits.hits[0]._source]);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return empty array when no documents found', async () => {
      mockElasticsearchService.search.mockResolvedValueOnce({
        hits: {
          hits: [],
        },
      });

      const result = await service.searchByDocument(mockCpf);

      expect(result).toEqual([]);
      expect(elasticsearchService.search).toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log error and rethrow when elasticsearch search fails', async () => {
      const error = new Error('Elasticsearch error');
      mockElasticsearchService.search.mockRejectedValueOnce(error);

      await expect(service.searchByDocument(mockCpf)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        `[${ESService.name}.searchByDocument()] Error searching document data`,
        error,
      );
    });
  });

  describe('index', () => {
    it('should successfully index document with CPF and benefits data', async () => {
      mockElasticsearchService.update.mockResolvedValueOnce({});

      await service.index({ cpf: mockCpf, benefitsData: mockBenefitsData });

      expect(elasticsearchService.update).toHaveBeenCalledWith({
        index: CONSTANTS.elasticsearch.benefitsIndex,
        body: {
          doc: {
            cpf: mockCpf,
            benefitsData: mockBenefitsData,
          },
          doc_as_upsert: true,
        },
        id: mockCpf,
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log error and rethrow when elasticsearch indexing fails', async () => {
      const error = new Error('Indexing error');
      mockElasticsearchService.update.mockRejectedValueOnce(error);

      await expect(
        service.index({ cpf: mockCpf, benefitsData: mockBenefitsData }),
      ).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        `[${ESService.name}.index()] Error indexing document data`,
        error,
      );
    });

    it('should handle different types of benefits data', async () => {
      const differentBenefitsData = {
        someOtherField: 'value',
        numberField: 123,
        nestedField: {
          key: 'value',
        },
      };
      mockElasticsearchService.update.mockResolvedValueOnce({});

      await service.index({
        cpf: mockCpf,
        benefitsData: differentBenefitsData,
      });

      expect(elasticsearchService.update).toHaveBeenCalledWith({
        index: CONSTANTS.elasticsearch.benefitsIndex,
        body: {
          doc: {
            cpf: mockCpf,
            benefitsData: differentBenefitsData,
          },
          doc_as_upsert: true,
        },
        id: mockCpf,
      });
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});
