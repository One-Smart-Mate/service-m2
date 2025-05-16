import { HttpException, HttpStatus } from '@nestjs/common';
import { stringConstants } from 'src/utils/string.constant';

export enum NotFoundCustomExceptionType {
  COMPANY,
  PRIORITY,
  USER,
  CARDTYPES,
  SITE,
  PRECLASSIFIER,
  LEVELS,
  ROLES,
  CARD,
  POSITION,
  CILT_SEQUENCES_EVIDENCES,
  CILT_SEQUENCES_EXECUTIONS,
  CILT_MSTR,
  CILT_TYPES,
  CILT_SEQUENCES,
  CILT_SEQUENCES_FREQUENCIES,
  CILT_FREQUENCIES,
  OPL_MSTR,
  OPL_DETAILS,
  REPOSITORY,
  OPLLEVELS
}

export class NotFoundCustomException extends HttpException {
  constructor(type: NotFoundCustomExceptionType) {
    let message: string;

    switch (type) {
      case NotFoundCustomExceptionType.COMPANY:
        message = stringConstants.companyNotFound;
        break;
      case NotFoundCustomExceptionType.PRIORITY:
        message = stringConstants.priorityNotFound;
        break;
      case NotFoundCustomExceptionType.USER:
        message = stringConstants.userNotFound;
        break;
      case NotFoundCustomExceptionType.CARDTYPES:
        message = stringConstants.cardTypesNotFound;
        break;
      case NotFoundCustomExceptionType.SITE:
        message = stringConstants.siteNotFound;
        break;
      case NotFoundCustomExceptionType.PRECLASSIFIER:
        message = stringConstants.preclsassifierNotFound;
        break;
      case NotFoundCustomExceptionType.LEVELS:
        message = stringConstants.levels;
        break;
      case NotFoundCustomExceptionType.ROLES:
        message = stringConstants.roles;
        break;
      case NotFoundCustomExceptionType.CARD:
        message = stringConstants.cardNotFound;
        break;
      case NotFoundCustomExceptionType.POSITION:
        message = stringConstants.positionNotFound;
        break;
      case NotFoundCustomExceptionType.CILT_SEQUENCES_EVIDENCES:
        message = stringConstants.ciltSequencesEvidencesNotFound;
        break;
      case NotFoundCustomExceptionType.CILT_SEQUENCES_EXECUTIONS:
        message = stringConstants.ciltSequencesExecutionsNotFound;
        break;
      case NotFoundCustomExceptionType.CILT_MSTR:
        message = stringConstants.ciltMstrNotFound;
        break;
      case NotFoundCustomExceptionType.CILT_TYPES:
        message = stringConstants.ciltTypesNotFound;
        break;
      case NotFoundCustomExceptionType.CILT_SEQUENCES:
        message = stringConstants.ciltSequencesNotFound;
        break;
      case NotFoundCustomExceptionType.CILT_SEQUENCES_FREQUENCIES:
        message = stringConstants.ciltSequencesFrequenciesNotFound;
        break;
      case NotFoundCustomExceptionType.CILT_FREQUENCIES:
        message = stringConstants.ciltFrequenciesNotFound;
        break;
      case NotFoundCustomExceptionType.OPL_MSTR:
        message = stringConstants.oplMstrNotFound;
        break;
      case NotFoundCustomExceptionType.OPL_DETAILS:
        message = stringConstants.oplDetailsNotFound;
        break;
      case NotFoundCustomExceptionType.REPOSITORY:
        message = stringConstants.repositoryNotFound;
        break;
      case NotFoundCustomExceptionType.OPLLEVELS:
        message = 'OPL Levels not found';
        break;
      default:
        message = 'Resource not found';
    }

    super(message, HttpStatus.NOT_FOUND);
  }
}
