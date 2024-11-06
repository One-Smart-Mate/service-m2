import { Logger } from '@nestjs/common';
import { NotFoundCustomException } from '../types/notFound.exception';
import { SqlException } from '../types/sql.exception';
import { ValidationException } from '../types/validation.exception';

export class HandleException {
  static exception(exception: any) {
    Logger.error(exception);
    if (exception instanceof ValidationException || exception instanceof NotFoundCustomException) {
      throw exception;
    }
    throw new SqlException(exception);
  }
}
