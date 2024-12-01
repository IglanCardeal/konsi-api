import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { INSSService } from '../inss.service';
import { LoggerService } from 'src/services/logger/logger.service';
import { RedisService } from 'src/services/redis/redis.service';
import { BenefitsApiResponse } from '../inss.dto';

describe('INSSService', () => {
  let service: INSSService;
  let logger: LoggerService;
  let redisService: RedisService;

  const mockConfig = {
    INSS_API_HOST: 'http://api.test',
    INSS_API_USER: 'testuser',
    INSS_API_PASSWORD: 'testpass',
    INSS_API_BENEFITS_PATH: '/benefits/{cpf}',
    INSS_API_AUTH_TOKEN_PATH: '/auth',
  };

  beforeEach(async () => {
    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        INSSService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => mockConfig[key]),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            info: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<INSSService>(INSSService);
    logger = module.get<LoggerService>(LoggerService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBenefitsData', () => {
    const mockBenefits: BenefitsApiResponse[] = [
      {
        numero_beneficio: '123456789',
        codigo_tipo_beneficio: '41',
      },
    ];

    const mockToken = 'test-token';
    const testCpf = '12345678901';

    beforeEach(() => {
      (redisService.get as jest.Mock).mockResolvedValue(mockToken);
    });

    it('should fetch and map benefits data successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: { beneficios: mockBenefits } }),
      });

      const result = await service.getBenefitsData(testCpf);

      expect(result).toEqual([
        {
          number: mockBenefits[0].numero_beneficio,
          code: mockBenefits[0].codigo_tipo_beneficio,
        },
      ]);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockConfig.INSS_API_HOST}/benefits/${testCpf}`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }),
      );
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(service.getBenefitsData('12345678901')).rejects.toThrow(
        'HTTP error! status: 500',
      );

      expect(logger.error).toHaveBeenCalledWith(
        '[INSSService.getBenefitsData()] Error while getting benefits data',
        expect.any(Error),
      );
    });

    it('should throw error for different HTTP status codes', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(null);
      const errorCodes = [400, 403, 404, 500, 503];

      for (const statusCode of errorCodes) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: statusCode,
          statusText: 'Error',
        });

        await expect(service.getBenefitsData('12345678901')).rejects.toThrow(
          `HTTP error! status: ${statusCode}`,
        );
      }
    });

    it('should retry with new token when receiving 401', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: { token: 'new-token' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: { beneficios: mockBenefits } }),
        });

      await service.getBenefitsData(testCpf);

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should throw error when benefits data is missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: { beneficios: [] } }),
      });

      await expect(service.getBenefitsData(testCpf)).rejects.toThrow(
        'Missing benefits data',
      );
    });
  });

  describe('getApiAuthToken', () => {
    const mockToken = 'test-token';

    it('should return cached token when available', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(mockToken);

      const result = await service['getApiAuthToken']();

      expect(result).toBe(mockToken);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch new token when cache is cleared', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: { token: mockToken } }),
      });

      const result = await service['getApiAuthToken'](true);

      expect(result).toBe(mockToken);
      expect(redisService.set).toHaveBeenCalledWith(
        'inss-api-token',
        mockToken,
      );
    });

    it('should throw error when token is missing in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: {} }),
      });

      await expect(service['getApiAuthToken'](true)).rejects.toThrow(
        'Missing auth token',
      );
    });
  });
});
