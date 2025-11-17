import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { LoggerService } from '../logger/logger.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
                REDIS_DB: 0,
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get and set', () => {
    it('should handle cache operations gracefully when disconnected', async () => {
      // When Redis is not connected, operations should return null/false
      const result = await service.get('test-key');
      expect(result).toBeNull();

      const setResult = await service.set('test-key', 'test-value');
      expect(setResult).toBe(false);
    });
  });

  describe('del', () => {
    it('should handle delete operation when disconnected', async () => {
      const result = await service.del('test-key');
      expect(result).toBe(false);
    });
  });
});
