import { HttpException, HttpStatus } from '@nestjs/common';
import { stringConstants } from 'src/utils/string.constant';

export class ValidationException extends HttpException {
  constructor(type: ValidationExceptionType, info?: string) {
    let message: string;

    switch (type) {
      case ValidationExceptionType.WRONG_AUTH:
        message = stringConstants.incorrectAuth;
        break;
      case ValidationExceptionType.DUPLICATE_RECORD:
        message = stringConstants.duplicateRecord;
        break;
      case ValidationExceptionType.DUPLICATED_USER:
        message = stringConstants.duplicateUser;
        break;
      case ValidationExceptionType.DUPLICATE_ROLE:
        message = stringConstants.duplicateRole;
        break;
      case ValidationExceptionType.DUPLICATE_CARD_UUID:
        message = stringConstants.duplicateCardUUID;
        break;
      case ValidationExceptionType.DUPLICATED_PRIORITY:
        message = stringConstants.duplicatePriority;
        break;
      case ValidationExceptionType.OVERWRITE_DEFINITIVE_SOLUTION:
        message = stringConstants.existDefinitiveSolution;
        break;
      case ValidationExceptionType.OVERWRITE_PROVISIONAL_SOLUTION:
        message = stringConstants.existProvisionalSolution;
        break;
      case ValidationExceptionType.USER_QUANTITY_EXCEEDED:
        message = stringConstants.quantityOfUsersExceeded;
        break;
      case ValidationExceptionType.RESETCODE_EXPIRED:
        message = stringConstants.codeExpired;
        break;
      case ValidationExceptionType.WRONG_RESET_CODE:
        message = stringConstants.wrongResetCode;
        break;
      case ValidationExceptionType.EMAIL_MISSING:
        message = stringConstants.emailIsMissing;
        break;
      case ValidationExceptionType.DUPLICATED_LEVELMACHINEID:
        message = stringConstants.duplicateLevelMachineId;
        break;
      case ValidationExceptionType.NO_FILE_UPLOADED:
        message = stringConstants.noFileUploaded;
        break;
      case ValidationExceptionType.INVALID_FILE_TYPE:
        message = stringConstants.invalidFileType;
        break;
      case ValidationExceptionType.DUPLICATED_EMAIL:
        message = stringConstants.duplicatedEmailAtRow + info;
        break;
      case ValidationExceptionType.MISSING_FIELDS:
        message = stringConstants.missingFieldsAtRow + info;
        break;
      case ValidationExceptionType.INVALID_ROLE:
        message = stringConstants.invalidRoleAtRow + info;
        break;
      case ValidationExceptionType.DUPLICATED_USER_AT_IMPORTATION:
        message = stringConstants.duplicateUserAtRow + info;
        break;
      case ValidationExceptionType.INVALID_HEX_FORMAT:
        message = stringConstants.invalidHexFormat;
        break;
      case ValidationExceptionType.INVALID_DATE:
        message = stringConstants.invalidDateProvided;
        break;
      case ValidationExceptionType.INVALID_DAY_COLUMN:
        message = stringConstants.invalidDayColumn;
        break;
      case ValidationExceptionType.INVALID_SCHEDULE_TYPE:
        message = stringConstants.invalidScheduleType;
        break;
      case ValidationExceptionType.CILT_SEQUENCE_ALREADY_STARTED:
        message = stringConstants.ciltSequenceAlreadyStarted;
        break;
      case ValidationExceptionType.CILT_SEQUENCE_NOT_ACTIVE:
        message = stringConstants.ciltSequenceNotActive;
        break;
      case ValidationExceptionType.CILT_SEQUENCE_INVALID_DATE:
        message = stringConstants.ciltSequenceInvalidDate;
        break;
      case ValidationExceptionType.CILT_SEQUENCE_NOT_STARTED:
        message = stringConstants.ciltSequenceNotStarted;
        break;
      case ValidationExceptionType.CILT_SEQUENCE_ALREADY_FINISHED:
        message = stringConstants.ciltSequenceAlreadyFinished;
        break;
      case ValidationExceptionType.INVALID_FAST_PASSWORD_FORMAT:
        message = stringConstants.invalidFastPasswordFormat;
        break;
      default:
        message = 'Validation error';
    }

    super(message, HttpStatus.BAD_REQUEST);
  }
}

export enum ValidationExceptionType {
  WRONG_AUTH,
  DUPLICATE_RECORD,
  DUPLICATED_USER,
  DUPLICATED_USER_AT_IMPORTATION,
  DUPLICATED_LEVELMACHINEID,
  DUPLICATE_ROLE,
  DUPLICATE_CARD_UUID,
  DUPLICATED_PRIORITY,
  OVERWRITE_PROVISIONAL_SOLUTION,
  OVERWRITE_DEFINITIVE_SOLUTION,
  USER_QUANTITY_EXCEEDED,
  RESETCODE_EXPIRED,
  WRONG_RESET_CODE,
  EMAIL_MISSING,
  NO_FILE_UPLOADED,
  INVALID_FILE_TYPE,
  DUPLICATED_EMAIL,
  MISSING_FIELDS,
  INVALID_ROLE,
  INVALID_HEX_FORMAT,
  INVALID_DATE,
  INVALID_DAY_COLUMN,
  INVALID_SCHEDULE_TYPE,
  CILT_SEQUENCE_ALREADY_STARTED,
  CILT_SEQUENCE_NOT_ACTIVE,
  CILT_SEQUENCE_INVALID_DATE,
  CILT_SEQUENCE_NOT_STARTED,
  CILT_SEQUENCE_ALREADY_FINISHED,
  INVALID_FAST_PASSWORD_FORMAT
}
