import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequencesEntity } from 'src/modules/ciltSequences/entities/ciltSequences.entity';
import { OplMstr } from 'src/modules/oplMstr/entities/oplMstr.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { CustomLoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class CiltValidationService {
  constructor(
    @InjectRepository(OplMstr)
    private readonly oplMstrRepository: Repository<OplMstr>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly logger: CustomLoggerService,
  ) {}

  /**
   * Validate all SOP references in CILT sequences
   */
  async validateSopReferences(ciltSequences: CiltSequencesEntity[]): Promise<void> {
    this.logger.logProcess('VALIDATING SOP REFERENCES', { sequencesCount: ciltSequences.length });
    
    const validationPromises = ciltSequences.map(async seq => {
      await this.validateSequenceSopReferences(seq);
    });

    await Promise.all(validationPromises);
    this.logger.logProcess('SOP REFERENCES VALIDATION COMPLETED');
  }

  /**
   * Validate SOP references for a specific sequence
   */
  async validateSequenceSopReferences(sequence: CiltSequencesEntity): Promise<void> {
    const validationPromises: Promise<void>[] = [];

    // Solo validar si el ID es mayor a 0
    if (sequence.referenceOplSopId && sequence.referenceOplSopId > 0) {
      validationPromises.push(this.validateReferenceOplSop(sequence.referenceOplSopId));
    }

    if (sequence.remediationOplSopId && Number(sequence.remediationOplSopId) > 0) {
      validationPromises.push(this.validateRemediationOplSop(Number(sequence.remediationOplSopId)));
    }

    await Promise.all(validationPromises);
  }

  /**
   * Validate that an OPL SOP reference exists
   */
  async validateReferenceOplSop(referenceOplSopId: number): Promise<void> {
    const ref = await this.oplMstrRepository.findOneBy({ id: referenceOplSopId });
    if (!ref) {
      this.logger.logProcess('REFERENCE OPL SOP NOT FOUND', { referenceOplSopId });
      throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
    }
    this.logger.logProcess('REFERENCE OPL SOP VALIDATED', { referenceOplSopId });
  }

  /**
   * Validate that a remediation OPL SOP exists
   */
  async validateRemediationOplSop(remediationOplSopId: number): Promise<void> {
    const rem = await this.oplMstrRepository.findOneBy({ id: remediationOplSopId });
    if (!rem) {
      this.logger.logProcess('REMEDIATION OPL SOP NOT FOUND', { remediationOplSopId });
      throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
    }
    this.logger.logProcess('REMEDIATION OPL SOP VALIDATED', { remediationOplSopId });
  }

  /**
   * Validate that a specific user exists
   */
  async validateUser(userId: number): Promise<UserEntity> {
    this.logger.logProcess('VALIDATING USER', { userId });
    
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      this.logger.logProcess('USER NOT FOUND', { userId });
      throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
    }
    
    this.logger.logProcess('USER VALIDATED', { userId, userName: user.name });
    return user;
  }

  /**
   * Validate multiple users in parallel
   */
  async validateUsers(userIds: number[]): Promise<UserEntity[]> {
    this.logger.logProcess('VALIDATING MULTIPLE USERS', { count: userIds.length });
    
    const validationPromises = userIds.map(async userId => {
      return await this.validateUser(userId);
    });

    const users = await Promise.all(validationPromises);
    this.logger.logProcess('MULTIPLE USERS VALIDATED', { validatedCount: users.length });
    return users;
  }

  /**
   * Validate that an array is not empty
   */
  validateNotEmpty<T>(array: T[], errorMessage: string): void {
    if (!array || array.length === 0) {
      this.logger.logProcess('EMPTY ARRAY VALIDATION FAILED', { errorMessage });
      throw new Error(errorMessage);
    }
    this.logger.logProcess('ARRAY NOT EMPTY VALIDATION PASSED', { count: array.length });
  }

  /**
   * Validate date ranges
   */
  validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) {
      const errorMessage = 'La fecha de inicio debe ser anterior a la fecha de fin';
      this.logger.logProcess('DATE RANGE VALIDATION FAILED', { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      });
      throw new Error(errorMessage);
    }
    this.logger.logProcess('DATE RANGE VALIDATION PASSED', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    });
  }

  /**
   * Validate that dates are in the correct format
   */
  validateDateFormat(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      const errorMessage = `Formato de fecha inválido: ${dateString}`;
      this.logger.logProcess('DATE FORMAT VALIDATION FAILED', { dateString });
      throw new Error(errorMessage);
    }
    this.logger.logProcess('DATE FORMAT VALIDATION PASSED', { dateString, parsedDate: date.toISOString() });
    return date;
  }
} 