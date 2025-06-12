import { NotFoundCustomException } from '../types/notFound.exception';
import { ValidationException } from '../types/validation.exception';
import { SqlException } from '../types/sql.exception';

export class HandleException {
  static exception(exception: any) {
    if (exception instanceof NotFoundCustomException || exception instanceof ValidationException) {
      throw exception;
    }
    throw new SqlException(exception);
  }
}
