import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between } from 'typeorm';
import { CiltSequencesExecutionsEntity } from './entities/ciltSequencesExecutions.entity';
import { CreateCiltSequencesExecutionDTO } from './models/dto/create.ciltSequencesExecution.dto';
import { UpdateCiltSequencesExecutionDTO } from './models/dto/update.ciltSequencesExecution.dto';
import { HandleException } from '../../common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from '../../common/exceptions/types/notFound.exception';
import { PositionEntity } from '../position/entities/position.entity';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationDTO } from '../firebase/models/firebase.request.dto';
import { stringConstants } from '../../utils/string.constant';
import { StartCiltSequencesExecutionDTO } from './models/dto/start.ciltSequencesExecution.dto';
import { StopCiltSequencesExecutionDTO } from './models/dto/stop.ciltSequencesExecution.dto';
import { ValidationException, ValidationExceptionType } from '../../common/exceptions/types/validation.exception';
import { CiltSequencesEntity } from '../ciltSequences/entities/ciltSequences.entity';
import { CiltSequencesExecutionsEvidencesService } from '../CiltSequencesExecutionsEvidences/ciltSequencesExecutionsEvidences.service';
import { CiltSequencesExecutionsEvidencesType, CreateCiltSequencesEvidenceDTO } from '../CiltSequencesExecutionsEvidences/models/dtos/createCiltSequencesEvidence.dto';
import { CreateEvidenceDTO } from './models/dto/create.evidence.dto';

@Injectable()
export class CiltSequencesExecutionsService {
  constructor(
    @InjectRepository(CiltSequencesExecutionsEntity)
    private readonly ciltSequencesExecutionsRepository: Repository<CiltSequencesExecutionsEntity>,
    @InjectRepository(PositionEntity)
    private readonly positionRepository: Repository<PositionEntity>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly firebaseService: FirebaseService,
    @InjectRepository(CiltSequencesEntity)
    private readonly ciltSequencesRepository: Repository<CiltSequencesEntity>,
    private readonly ciltSequencesExecutionsEvidencesService: CiltSequencesExecutionsEvidencesService,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltSequencesExecutionsRepository.find({
        where: { deletedAt: IsNull() }
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltSequencesExecutionsRepository.find({ 
        where: { 
          siteId,
          deletedAt: IsNull() 
        },
        relations: ['evidences']
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByPositionId = async (positionId: number) => {
    try {
      return await this.ciltSequencesExecutionsRepository.find({ 
        where: { 
          positionId,
          deletedAt: IsNull() 
        } 
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltId = async (ciltId: number) => {
    try {
      return await this.ciltSequencesExecutionsRepository.find({ 
        where: { 
          ciltId,
          deletedAt: IsNull() 
        } 
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltDetailsId = async (ciltDetailsId: number) => {
    try {
      return await this.ciltSequencesExecutionsRepository.find({ 
        where: { 
          ciltSecuenceId: ciltDetailsId,
          deletedAt: IsNull() 
        } 
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltSequenceIdAndDate = async (ciltSequenceId: number, date: string) => {
    try {
      // First we get the sequence
      const sequence = await this.ciltSequencesRepository.findOne({
        where: { id: ciltSequenceId }
      });

      if (!sequence) {
        return null;
      }

      // Then we get the executions
      const executions = await this.ciltSequencesExecutionsRepository
        .createQueryBuilder('execution')
        .where('execution.ciltSecuenceId = :ciltSequenceId', { ciltSequenceId })
        .andWhere('DATE(execution.secuenceSchedule) = :date', { date })
        .andWhere('execution.status = :status', { status: 'A' })
        .andWhere('execution.deletedAt IS NULL')
        .getMany();

      // We return the sequence with its executions
      return {
        ...sequence,
        executions
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const execution = await this.ciltSequencesExecutionsRepository.findOne({ 
        where: { 
          id,
          deletedAt: IsNull() 
        } 
      });
      if (!execution) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SEQUENCES_EXECUTIONS);
      }
      return execution;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createDTO: CreateCiltSequencesExecutionDTO) => {
    try {
      const execution = this.ciltSequencesExecutionsRepository.create(createDTO);
      return await this.ciltSequencesExecutionsRepository.save(execution);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateDTO: UpdateCiltSequencesExecutionDTO) => {
    try {
      const execution = await this.findById(updateDTO.id);
      Object.assign(execution, updateDTO);
      const updatedExecution = await this.ciltSequencesExecutionsRepository.save(execution);

      if (updateDTO.stoppageReason === true) {
        const position = await this.positionRepository.findOneBy({ nodeResponsableId: execution.positionId });
        if (position) {
          const tokens = await this.usersService.getUserToken(position.nodeResponsableId);
          
          if (tokens.length > 0) {
            await this.firebaseService.sendMultipleMessage(
              new NotificationDTO(
                stringConstants.ciltTitle,
                `La posición ${position.name} ha reportado una condición de paro`,
                stringConstants.ciltNotificationType,
              ),
              tokens,
            );
          }
          const user = await this.usersService.findById(position.nodeResponsableId);

          if (user && user.email) {
            await this.mailService.sendCiltStoppageNotification(
              user,
              position.name,
              stringConstants.LANG_ES,
            );
          }
        }
      }

      return updatedExecution;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  softDelete = async (id: number) => {
    try {
      const execution = await this.findById(id);
      if (!execution) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SEQUENCES_EXECUTIONS);
      }

      // Set the deletedAt field to the current timestamp
      execution.deletedAt = new Date();
      
      // Save the entity with the updated deletedAt timestamp
      return await this.ciltSequencesExecutionsRepository.save(execution);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  async start(startDTO: StartCiltSequencesExecutionDTO) {
    try {
      const execution = await this.findById(startDTO.id);
      if (!execution) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SEQUENCES_EXECUTIONS);
      }
    
      if (execution.secuenceStart) {
        throw new ValidationException(ValidationExceptionType.CILT_SEQUENCE_ALREADY_STARTED);
      }

      if (execution.status === stringConstants.completedStatus) {
        throw new ValidationException(ValidationExceptionType.CILT_SEQUENCE_NOT_ACTIVE);
      }
    
      const startDate = new Date(startDTO.startDate);
      if (isNaN(startDate.getTime())) {
        throw new ValidationException(ValidationExceptionType.CILT_SEQUENCE_INVALID_DATE);
      }

      execution.secuenceStart = startDate;
      execution.updatedAt = new Date();
      
      try {
        return await this.ciltSequencesExecutionsRepository.update(execution.id, execution);
      } catch (saveError) {
        throw new Error(`Failed to save CILT sequence execution: ${saveError.message}`);
      }
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async stop(stopDTO: StopCiltSequencesExecutionDTO) {
    try {
      const execution = await this.findById(stopDTO.id);
      if (!execution) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SEQUENCES_EXECUTIONS);
      }

      if (!execution.secuenceStart) {
        throw new ValidationException(ValidationExceptionType.CILT_SEQUENCE_NOT_STARTED);
      }

      if (execution.secuenceStop) {
        throw new ValidationException(ValidationExceptionType.CILT_SEQUENCE_ALREADY_FINISHED);
      }

      if (execution.status !== stringConstants.activeStatus) {
        throw new ValidationException(ValidationExceptionType.CILT_SEQUENCE_NOT_ACTIVE);
      }

      const stopDate = new Date(stopDTO.stopDate);
      if (isNaN(stopDate.getTime())) {
        throw new ValidationException(ValidationExceptionType.CILT_SEQUENCE_INVALID_DATE);
      }

      const startDate = new Date(execution.secuenceStart);
      const durationInSeconds = Math.floor((stopDate.getTime() - startDate.getTime()) / 1000);

      Object.assign(execution, {
        status: stringConstants.completedStatus,
        secuenceStop: stopDate,
        realDuration: durationInSeconds,
        initialParameter: stopDTO.initialParameter?.toString(),
        evidenceAtCreation: stopDTO.evidenceAtCreation,
        finalParameter: stopDTO.finalParameter?.toString(),
        evidenceAtFinal: stopDTO.evidenceAtFinal,
        nok: stopDTO.nok,
        amTagId: stopDTO.amTagId,
        updatedAt: new Date()
      });


      await this.ciltSequencesExecutionsRepository.update(execution.id, execution);
      
      return this.findById(execution.id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async findAllByUserIdAndDate(userId: number, date: string) {
    try {
      const [year, month, day] = date.split('-').map(Number);
      
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      return await this.ciltSequencesExecutionsRepository.find({
        where: { userId, secuenceSchedule: Between(startOfDay, endOfDay), status: 'I', deletedAt: IsNull() }
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async createEvidence(createEvidenceDTO: CreateEvidenceDTO) {
    try {
      const execution = await this.findById(createEvidenceDTO.executionId);
      
      const fullEvidenceDTO: CreateCiltSequencesEvidenceDTO = {
        siteId: execution.siteId,
        positionId: execution.positionId,
        ciltId: execution.ciltId,
        ciltSequencesExecutionsId: createEvidenceDTO.executionId,
        evidenceUrl: createEvidenceDTO.evidenceUrl,
        type: createEvidenceDTO.type as CiltSequencesExecutionsEvidencesType,
        createdAt: createEvidenceDTO.createdAt,
      };

      return await this.ciltSequencesExecutionsEvidencesService.create(fullEvidenceDTO);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
  async deleteEvidence(id: number) {
    try {
      return await this.ciltSequencesExecutionsEvidencesService.delete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  /**
   * Compare programmed vs executed by day
   */
  async getExecutionChart(filters: {
    startDate: string;
    endDate: string;
    siteId?: number;
    positionId?: number;
    levelId?: number;
  }) {
    try {
      const query = this.ciltSequencesExecutionsRepository
        .createQueryBuilder('execution')
        .select([
          'DATE(execution.secuenceSchedule) as date',
          'COUNT(*) as programmed',
          'SUM(CASE WHEN execution.secuenceStart IS NOT NULL THEN 1 ELSE 0 END) as executed'
        ])
        .where('execution.deletedAt IS NULL')
        .andWhere('DATE(execution.secuenceSchedule) BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate
        });

      if (filters.siteId) {
        query.andWhere('execution.siteId = :siteId', { siteId: filters.siteId });
      }

      if (filters.positionId) {
        query.andWhere('execution.positionId = :positionId', { positionId: filters.positionId });
      }

      if (filters.levelId) {
        query.andWhere('execution.levelId = :levelId', { levelId: filters.levelId });
      }

      const result = await query
        .groupBy('DATE(execution.secuenceSchedule)')
        .orderBy('DATE(execution.secuenceSchedule)', 'ASC')
        .getRawMany();

      return result.map(item => ({
        date: item.date,
        programmed: parseInt(item.programmed),
        executed: parseInt(item.executed)
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  /**
   * Compliance by person
   */
  async getComplianceByPersonChart(filters: {
    startDate: string;
    endDate: string;
    siteId?: number;
    positionId?: number;
    levelId?: number;
  }) {
    try {
      const query = this.ciltSequencesExecutionsRepository
        .createQueryBuilder('execution')
        .leftJoin('execution.user', 'user')
        .leftJoin('execution.userWhoExecuted', 'userWhoExecuted')
        .select([
          'user.id as userId',
          'user.name as userName',
          'COUNT(*) as assigned',
          'SUM(CASE WHEN execution.secuenceStart IS NOT NULL THEN 1 ELSE 0 END) as executed'
        ])
        .where('execution.deletedAt IS NULL')
        .andWhere('execution.userId IS NOT NULL')
        .andWhere('DATE(execution.secuenceSchedule) BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate
        });

      if (filters.siteId) {
        query.andWhere('execution.siteId = :siteId', { siteId: filters.siteId });
      }

      if (filters.positionId) {
        query.andWhere('execution.positionId = :positionId', { positionId: filters.positionId });
      }

      if (filters.levelId) {
        query.andWhere('execution.levelId = :levelId', { levelId: filters.levelId });
      }

      const result = await query
        .groupBy('user.id, user.name')
        .orderBy('user.name', 'ASC')
        .getRawMany();

      return result.map(item => ({
        userId: item.userId,
        userName: item.userName,
        assigned: parseInt(item.assigned),
        executed: parseInt(item.executed),
        compliancePercentage: item.assigned > 0 ? (parseInt(item.executed) / parseInt(item.assigned)) * 100 : 0
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  /**
   * Time by day
   */
  async getTimeChart(filters: {
    startDate: string;
    endDate: string;
    siteId?: number;
    positionId?: number;
    levelId?: number;
  }) {
    try {
      const query = this.ciltSequencesExecutionsRepository
        .createQueryBuilder('execution')
        .select([
          'DATE(execution.secuenceSchedule) as date',
          'SUM(COALESCE(execution.duration, 0)) as standardTime',
          'SUM(COALESCE(execution.realDuration, 0)) as realTime',
          'COUNT(CASE WHEN execution.secuenceStart IS NOT NULL THEN 1 END) as executedCount'
        ])
        .where('execution.deletedAt IS NULL')
        .andWhere('DATE(execution.secuenceSchedule) BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate
        });

      if (filters.siteId) {
        query.andWhere('execution.siteId = :siteId', { siteId: filters.siteId });
      }

      if (filters.positionId) {
        query.andWhere('execution.positionId = :positionId', { positionId: filters.positionId });
      }

      if (filters.levelId) {
        query.andWhere('execution.levelId = :levelId', { levelId: filters.levelId });
      }

      const result = await query
        .groupBy('DATE(execution.secuenceSchedule)')
        .orderBy('DATE(execution.secuenceSchedule)', 'ASC')
        .getRawMany();

      return result.map(item => ({
        date: item.date,
        standardTime: parseInt(item.standardTime) || 0, // in seconds
        realTime: parseInt(item.realTime) || 0, // in seconds
        executedCount: parseInt(item.executedCount),
        standardTimeMinutes: Math.round((parseInt(item.standardTime) || 0) / 60), // convert to minutes
        realTimeMinutes: Math.round((parseInt(item.realTime) || 0) / 60), // convert to minutes
        efficiencyPercentage: item.standardTime > 0 ? (parseInt(item.realTime) / parseInt(item.standardTime)) * 100 : 0
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  /**
   * Anomalies detected (TAGs) during the execution
   */
  async getAnomaliesChart(filters: {
    startDate: string;
    endDate: string;
    siteId?: number;
    positionId?: number;
    levelId?: number;
  }) {
    try {
      const query = this.ciltSequencesExecutionsRepository
        .createQueryBuilder('execution')
        .select([
          'DATE(execution.secuenceSchedule) as date',
          'COUNT(CASE WHEN (execution.nok = 1 OR execution.amTagId IS NOT NULL) THEN 1 END) as anomalies',
          'COUNT(CASE WHEN execution.nok = 1 THEN 1 END) as nokAnomalies',
          'COUNT(CASE WHEN execution.amTagId IS NOT NULL AND execution.amTagId > 0 THEN 1 END) as amTagAnomalies',
          'COUNT(CASE WHEN execution.stoppageReason = 1 THEN 1 END) as stoppageAnomalies'
        ])
        .where('execution.deletedAt IS NULL')
        .andWhere('execution.secuenceStart IS NOT NULL') // only count executed
        .andWhere('DATE(execution.secuenceSchedule) BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate
        });

      if (filters.siteId) {
        query.andWhere('execution.siteId = :siteId', { siteId: filters.siteId });
      }

      if (filters.positionId) {
        query.andWhere('execution.positionId = :positionId', { positionId: filters.positionId });
      }

      if (filters.levelId) {
        query.andWhere('execution.levelId = :levelId', { levelId: filters.levelId });
      }

      const result = await query
        .groupBy('DATE(execution.secuenceSchedule)')
        .orderBy('DATE(execution.secuenceSchedule)', 'ASC')
        .getRawMany();

      return result.map(item => ({
        date: item.date,
        totalAnomalies: parseInt(item.anomalies),
        nokAnomalies: parseInt(item.nokAnomalies),
        amTagAnomalies: parseInt(item.amTagAnomalies),
        stoppageAnomalies: parseInt(item.stoppageAnomalies)
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  }


  
} 