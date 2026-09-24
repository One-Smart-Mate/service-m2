import { SqlException } from '../types/sql.exception';
import { HttpException } from '@nestjs/common';

export class HandleException {
  static exception(exception: unknown): never {
    if (exception instanceof HttpException) {
      throw exception;
    }

    throw new SqlException(exception);
  }
}
