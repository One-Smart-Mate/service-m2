import { NotFoundCustomException } from '../types/notFound.exception';
import { ValidationException } from '../types/validation.exception';
import { SqlException } from '../types/sql.exception';
import { UnauthorizedException } from '@nestjs/common';

export class HandleException {
  static exception(exception: any) {
    if (exception instanceof NotFoundCustomException || exception instanceof ValidationException || exception instanceof UnauthorizedException) {
      throw exception;
    }
    throw new SqlException(exception);
  }
}
