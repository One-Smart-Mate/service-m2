import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService } from '../common/logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { path, body } = request;
    
    this.logger.logRequest(path, body);

    return next.handle().pipe(
      tap({
        error: (error) => {
          const controller = context.getClass().name;
          const method = context.getHandler().name;
          this.logger.logException(controller, method, error);
        }
      })
    );
  }
} 