import { HttpException, HttpStatus } from '@nestjs/common';
import { stringConstants } from 'src/utils/string.constant';

export class SqlException extends HttpException {
  constructor(exception: any) {
    let message;
    if (exception && exception.sqlState) {
      message = getExceptionMessageFromCode(exception.sqlState);
    }
    super(message, HttpStatus.BAD_REQUEST);
  }
}

const getExceptionMessageFromCode = (code: string): string => {
  switch (code) {
    case '23000':
      return stringConstants.INSERT_DATA_ERROR;
    case '42S02':
      return stringConstants.TABLE_NOT_FOUND;
    default:
      return stringConstants.UNHANDLED_SQL_ERROR;
  }
};
