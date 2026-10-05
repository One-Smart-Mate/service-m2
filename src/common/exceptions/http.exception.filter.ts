import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { HandleException } from './handler/handle.exception';
import { errorDiagnostics } from './error-details';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const normalized = HandleException.normalize(exception);
    const status = normalized.getStatus();
    const errorId = randomUUID();
    const body = normalized.getResponse();
    const suppliedMessage =
      typeof body === 'string' ? body : (body as { message?: unknown }).message;
    const publicMessage = Array.isArray(suppliedMessage)
      ? suppliedMessage[0]
      : suppliedMessage;
    // HTTP 5xx exceptions can carry driver/configuration details as well.
    const message =
      status >= 500
        ? (HttpStatus[status]?.replace(/_/g, ' ').toLowerCase() ??
          'internal server error')
        : typeof publicMessage === 'string'
          ? publicMessage
          : normalized.message;

    const diagnostic = {
      event: 'http.error',
      errorId,
      statusCode: status,
      method: request.method,
      // Use the route pattern; query strings, request bodies and dynamic IDs are not logged.
      route:
        typeof request.route?.path === 'string'
          ? request.route.path
          : 'unknown',
      ...errorDiagnostics(normalized),
    };
    if (status >= 500) this.logger.error(diagnostic);
    else if (normalized.cause) this.logger.warn(diagnostic);

    if (response.headersSent) return;
    response.setHeader('X-Error-Id', errorId);
    response.status(status).json({
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.path,
      errorId,
    });
  }
}
