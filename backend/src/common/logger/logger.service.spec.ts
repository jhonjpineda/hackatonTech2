import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                LOG_LEVEL: 'info',
                LOG_FILE_PATH: './logs',
                NODE_ENV: 'test',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log methods', () => {
    it('should set context', () => {
      expect(() => service.setContext('TestContext')).not.toThrow();
    });

    it('should log info messages', () => {
      expect(() => service.log('Test message')).not.toThrow();
    });

    it('should log error messages', () => {
      expect(() => service.error('Test error')).not.toThrow();
    });

    it('should log warning messages', () => {
      expect(() => service.warn('Test warning')).not.toThrow();
    });

    it('should log debug messages', () => {
      expect(() => service.debug('Test debug')).not.toThrow();
    });
  });
});
