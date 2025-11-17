import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const now = Date.now();

    // Log the request
    this.logger.logRequest(request);

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - now;
          this.logger.logResponse(request, response, responseTime);
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `${request.method} ${request.url} ${error.status || 500} - ${responseTime}ms`,
            error.stack,
          );
        },
      }),
    );
  }
}
