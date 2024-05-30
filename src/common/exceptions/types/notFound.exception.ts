import { HttpException, HttpStatus } from '@nestjs/common';
import { stringConstants } from 'src/utils/string.constant';

export class NotFoundCustomException extends HttpException {
  constructor(type: NotFoundCustomExceptionType) {
    let message;
    if (type === NotFoundCustomExceptionType.COMPANY) {
      message = stringConstants.companyNotFound;
    }
    if (type === NotFoundCustomExceptionType.PRIORITY) {
      message = stringConstants.priorityNotFound;
    }
    if (type === NotFoundCustomExceptionType.USER) {
      message = stringConstants.userNotFound;
    }
    super(message, HttpStatus.NOT_FOUND);
  }
}

export enum NotFoundCustomExceptionType {
  COMPANY,
  PRIORITY,
  USER,
}
