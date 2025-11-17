import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(private configService?: ConfigService) {
    this.initializeLogger();
  }

  private initializeLogger() {
    const logLevel = this.configService?.get<string>('LOG_LEVEL') || 'info';
    const logPath = this.configService?.get<string>('LOG_FILE_PATH') || './logs';
    const nodeEnv = this.configService?.get<string>('NODE_ENV') || 'development';

    // Formato personalizado para logs
    const customFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
        const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        const contextString = context ? `[${context}]` : '';
        const traceString = trace ? `\n${trace}` : '';
        return `${timestamp} [${level.toUpperCase()}] ${contextString} ${message} ${metaString}${traceString}`;
      }),
    );

    // Transports
    const transports: winston.transport[] = [];

    // Console transport (siempre activo)
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({ all: true }),
          customFormat,
        ),
      }),
    );

    // File transport para errores
    transports.push(
      new DailyRotateFile({
        filename: path.join(logPath, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format: customFormat,
      }),
    );

    // File transport para todos los logs
    transports.push(
      new DailyRotateFile({
        filename: path.join(logPath, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: customFormat,
      }),
    );

    // File transport para requests HTTP (opcional)
    if (nodeEnv === 'production') {
      transports.push(
        new DailyRotateFile({
          filename: path.join(logPath, 'http-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'http',
          maxSize: '20m',
          maxFiles: '7d',
          format: customFormat,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: customFormat,
      transports,
      exceptionHandlers: [
        new DailyRotateFile({
          filename: path.join(logPath, 'exceptions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
      rejectionHandlers: [
        new DailyRotateFile({
          filename: path.join(logPath, 'rejections-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { context: context || this.context, trace });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context: context || this.context });
  }

  // Métodos adicionales útiles
  http(message: any, meta?: any) {
    this.logger.http(message, meta);
  }

  logRequest(req: any) {
    this.http(`${req.method} ${req.url}`, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      body: req.method !== 'GET' ? req.body : undefined,
    });
  }

  logResponse(req: any, res: any, responseTime: number) {
    this.http(`${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`, {
      ip: req.ip,
      statusCode: res.statusCode,
      responseTime,
    });
  }

  logError(error: Error, context?: string) {
    this.error(error.message, error.stack, context);
  }
}
