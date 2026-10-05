import { HttpException, HttpStatus } from '@nestjs/common';
import { driverErrorRecord, isUnavailableError } from '../error-details';

export class SqlException extends HttpException {
  constructor(exception: unknown) {
    const driver = driverErrorRecord(exception);
    const unavailable = isUnavailableError(exception);
    const conflict =
      driver.sqlState === '23000' ||
      [
        'ER_DUP_ENTRY',
        'ER_ROW_IS_REFERENCED_2',
        'ER_NO_REFERENCED_ROW_2',
      ].includes(String(driver.code)) ||
      [1062, 1451, 1452].includes(Number(driver.errno));
    const status = unavailable
      ? HttpStatus.SERVICE_UNAVAILABLE
      : conflict
        ? HttpStatus.CONFLICT
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = unavailable
      ? 'Service temporarily unavailable'
      : conflict
        ? 'The operation conflicts with existing data'
        : 'Internal server error';
    super(message, status, { cause: exception });
  }
}
