import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as redis from 'redis';
import { RedisService } from '../redis.service';
import { LoggerService } from 'src/services/logger/logger.service';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('RedisService', () => {
  let service: RedisService;
  let configService: ConfigService;
  let logger: LoggerService;
  let mockRedisClient: any;

  const mockConfig = {
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    REDIS_CACHE_TTL: 7200,
  };

  beforeEach(async () => {
    mockRedisClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    };

    (redis.createClient as jest.Mock).mockReturnValue(mockRedisClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => mockConfig[key]),
            get: jest.fn((key: string) => mockConfig[key]),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(redis.createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
      });
      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      );
    });

    it('should use default cache expiration when REDIS_CACHE_TTL is not set', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RedisService,
          {
            provide: ConfigService,
            useValue: configService,
          },
          {
            provide: LoggerService,
            useValue: {
              error: jest.fn(),
            },
          },
        ],
      }).compile();

      const serviceInstance = module.get<RedisService>(RedisService);
      expect(serviceInstance).toBeDefined();
      expect(configService.get).toHaveBeenCalledWith('REDIS_CACHE_TTL');
    });
  });

  describe('get', () => {
    it('should return parsed data when key exists', async () => {
      const mockData = { foo: 'bar' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await service.get('test-key');

      expect(result).toEqual(mockData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('non-existent-key');

      expect(result).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalledWith('non-existent-key');
    });

    it('should throw and log error when redis get fails', async () => {
      const error = new Error('Redis error');
      mockRedisClient.get.mockRejectedValue(error);

      await expect(service.get('test-key')).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        '[RedisService] Redis Get Error:',
        error,
      );
    });
  });

  describe('set', () => {
    it('should set value with expiration', async () => {
      const testKey = 'test-key';
      const testValue = { foo: 'bar' };

      await service.set(testKey, testValue);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(testValue),
        {
          EX: mockConfig.REDIS_CACHE_TTL,
        },
      );
    });

    it('should throw and log error when redis set fails', async () => {
      const error = new Error('Redis error');
      mockRedisClient.set.mockRejectedValue(error);

      await expect(service.set('test-key', { foo: 'bar' })).rejects.toThrow(
        error,
      );
      expect(logger.error).toHaveBeenCalledWith(
        '[RedisService] Redis Set Error:',
        error,
      );
    });
  });

  describe('error handling', () => {
    it('should log redis client errors', () => {
      const error = new Error('Redis client error');
      const errorCallback = mockRedisClient.on.mock.calls.find(
        (call) => call[0] === 'error',
      )[1];

      errorCallback(error);

      expect(logger.error).toHaveBeenCalledWith(
        '[RedisService] Redis Client Error:',
        error,
      );
    });

    it('should log connection errors', async () => {
      const error = new Error('Connection error');
      mockRedisClient.connect.mockRejectedValue(error);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RedisService,
          {
            provide: ConfigService,
            useValue: configService,
          },
          {
            provide: LoggerService,
            useValue: {
              error: jest.fn(),
            },
          },
        ],
      }).compile();

      const serviceInstance = module.get<RedisService>(RedisService);
      const logger = module.get<LoggerService>(LoggerService);
      expect(serviceInstance).toBeDefined();

      await new Promise(process.nextTick);

      expect(logger.error).toHaveBeenCalledWith(
        '[RedisService] Redis Connection Error:',
        error,
      );
    });
  });
});
