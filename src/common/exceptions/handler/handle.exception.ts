import { SqlException } from '../types/sql.exception';
import { ValidationException } from '../types/validation.exception';

export class HandleException {
  static exception(exception: any) {
    if (exception instanceof ValidationException) {
      throw exception;
    }
    throw new SqlException(exception);
  }
}
