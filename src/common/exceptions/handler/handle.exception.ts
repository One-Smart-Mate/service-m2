import { SqlException } from '../types/sql.exception';
import {
  HttpException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { isDatabaseError, isUnavailableError } from '../error-details';

export class HandleException {
  static exception(exception: unknown): never {
    throw this.normalize(exception);
  }

  static normalize(exception: unknown): HttpException {
    if (exception instanceof HttpException) {
      return exception;
    }
    if (isDatabaseError(exception)) return new SqlException(exception);
    if (isUnavailableError(exception))
      return new ServiceUnavailableException(
        'Service temporarily unavailable',
        { cause: exception },
      );
    return new InternalServerErrorException('Internal server error', {
      cause: exception,
    });
  }
}
