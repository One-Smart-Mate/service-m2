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
  REPOSITORY
}

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
    if (type === NotFoundCustomExceptionType.CARDTYPES) {
      message = stringConstants.cardTypesNotFound;
    }
    if (type === NotFoundCustomExceptionType.SITE) {
      message = stringConstants.siteNotFound;
    }
    if (type === NotFoundCustomExceptionType.PRECLASSIFIER) {
      message = stringConstants.preclsassifierNotFound;
    }
    if (type === NotFoundCustomExceptionType.LEVELS) {
      message = stringConstants.levels;
    }
    if (type === NotFoundCustomExceptionType.ROLES) {
      message = stringConstants.roles;
    }
    if (type === NotFoundCustomExceptionType.CARD) {
      message = stringConstants.cardNotFound;
    }
    if (type === NotFoundCustomExceptionType.POSITION) {
      message = stringConstants.positionNotFound;
    }
    if (type === NotFoundCustomExceptionType.CILT_SEQUENCES_EVIDENCES) {
      message = stringConstants.ciltSequencesEvidencesNotFound;
    }
    if (type === NotFoundCustomExceptionType.CILT_SEQUENCES_EXECUTIONS) {
      message = stringConstants.ciltSequencesExecutionsNotFound;
    }
    if (type === NotFoundCustomExceptionType.CILT_MSTR) {
      message = stringConstants.ciltMstrNotFound;
    }
    if (type === NotFoundCustomExceptionType.CILT_TYPES) {
      message = stringConstants.ciltTypesNotFound;
    }
    if (type === NotFoundCustomExceptionType.CILT_SEQUENCES) {
      message = stringConstants.ciltSequencesNotFound;
    }
    if (type === NotFoundCustomExceptionType.CILT_SEQUENCES_FREQUENCIES) {
      message = stringConstants.ciltSequencesFrequenciesNotFound;
    }
    if (type === NotFoundCustomExceptionType.CILT_FREQUENCIES) {
      message = stringConstants.ciltFrequenciesNotFound;
    }
    if (type === NotFoundCustomExceptionType.OPL_MSTR) {
      message = stringConstants.oplMstrNotFound;
    }
    if (type === NotFoundCustomExceptionType.OPL_DETAILS) {
      message = stringConstants.oplDetailsNotFound;
    }
    if (type === NotFoundCustomExceptionType.REPOSITORY) {
      message = stringConstants.repositoryNotFound;
    }
    super(message, HttpStatus.NOT_FOUND);
  }
}
