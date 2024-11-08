import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { capitalizeAndJoinWords } from 'src/utils/general.functions';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const responseBody = {
      message: exception.message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof BadRequestException) {
      let badRequestResponseData = exception.getResponse() as Record<
        string,
        any
      >;
      if (Array.isArray(badRequestResponseData.message)) {
        responseBody.message = badRequestResponseData.message[0];
      } else {
        responseBody.message = badRequestResponseData.message
      }
    }

    response.status(status).json(responseBody);
  }
}
