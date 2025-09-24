import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between } from 'typeorm';
import { getUTCRangeFromLocalDate } from '../../utils/timezone.utils';
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
import { CiltMstrPositionLevelsEntity } from '../ciltMstrPositionLevels/entities/ciltMstrPositionLevels.entity';
import { CiltSequencesExecutionsEvidencesType, CreateCiltSequencesEvidenceDTO } from '../CiltSequencesExecutionsEvidences/models/dtos/createCiltSequencesEvidence.dto';
import { CreateEvidenceDTO } from './models/dto/create.evidence.dto';
import { CardEntity } from '../card/entities/card.entity';
import { GenerateCiltSequencesExecutionDTO } from './models/dto/generate.ciltSequencesExecution.dto';
import { CustomLoggerService } from '../../common/logger/logger.service';

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
    @InjectRepository(CiltMstrPositionLevelsEntity)
    private readonly ciltMstrPositionLevelsRepository: Repository<CiltMstrPositionLevelsEntity>,
    private readonly ciltSequencesExecutionsEvidencesService: CiltSequencesExecutionsEvidencesService,
    @InjectRepository(CardEntity)
    private readonly cardRepository: Repository<CardEntity>,
    private readonly logger: CustomLoggerService,
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
        relations: ['evidences','ciltMstr']
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

      // Obtener amTagIds de las mismas executions que ya se filtraron
      const amTagQuery = this.ciltSequencesExecutionsRepository
        .createQueryBuilder('execution')
        .select(['execution.amTagId', 'DATE(execution.secuenceSchedule) as date'])
        .where('execution.deletedAt IS NULL')
        .andWhere('execution.secuenceStart IS NOT NULL')
        .andWhere('execution.amTagId IS NOT NULL')
        .andWhere('execution.amTagId > 0')
        .andWhere('DATE(execution.secuenceSchedule) BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate
        });

      if (filters.siteId) {
        amTagQuery.andWhere('execution.siteId = :siteId', { siteId: filters.siteId });
      }

      if (filters.positionId) {
        amTagQuery.andWhere('execution.positionId = :positionId', { positionId: filters.positionId });
      }

      if (filters.levelId) {
        amTagQuery.andWhere('execution.levelId = :levelId', { levelId: filters.levelId });
      }

      const amTagResults = await amTagQuery.getRawMany();
      console.log('amTagResults:', amTagResults);
      const uniqueAmTagIds = [...new Set(amTagResults.map(item => item.execution_am_tag_id))];
      console.log('uniqueAmTagIds:', uniqueAmTagIds);

      // Obtener las cards
      let cards = [];
      if (uniqueAmTagIds.length > 0) {
        cards = await this.cardRepository
          .createQueryBuilder('card')
          .where('card.id IN (:...ids)', { ids: uniqueAmTagIds })
          .andWhere('card.deletedAt IS NULL')
          .getMany();
        console.log('cards found:', cards.length);
      }

      // Agrupar amTagIds por fecha
      const amTagsByDate = {};
      amTagResults.forEach(item => {
        const date = item.date;
        if (!amTagsByDate[date]) {
          amTagsByDate[date] = [];
        }
        amTagsByDate[date].push(item.execution_am_tag_id);
      });

      // Crear mapa de cards
      const cardsMap = new Map(cards.map(card => [card.id, card]));

      return result.map(item => {
        const dateCards = (amTagsByDate[item.date] || [])
          .map(amTagId => cardsMap.get(amTagId))
          .filter(card => card);

        return {
          date: item.date,
          totalAnomalies: parseInt(item.anomalies),
          nokAnomalies: parseInt(item.nokAnomalies),
          amTagAnomalies: parseInt(item.amTagAnomalies),
          stoppageAnomalies: parseInt(item.stoppageAnomalies),
          relatedCards: dateCards
        };
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  generate = async (generateDto: GenerateCiltSequencesExecutionDTO) => {
    try {
      const sequence = await this.ciltSequencesRepository.findOne({
        where: { 
          id: generateDto.sequenceId,
          deletedAt: IsNull()
        },
        relations: ['ciltMstr', 'site']
      });

      if (!sequence) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SEQUENCES);
      }

      const user = await this.usersService.findById(generateDto.userId);
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const ciltMstrPositionLevel = await this.ciltMstrPositionLevelsRepository.findOne({
        where: {
          ciltMstrId: sequence.ciltMstrId,
          deletedAt: IsNull()
        }
      });

      if (!ciltMstrPositionLevel) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR_POSITION_LEVELS);
      }

      const lastExecution = await this.ciltSequencesExecutionsRepository.findOne({
        where: {
          siteId: sequence.siteId,
          deletedAt: IsNull()
        },
        order: {
          siteExecutionId: 'DESC'
        }
      });

      const nextSiteExecutionId = (lastExecution?.siteExecutionId || 0) + 1;

      const newExecution = this.ciltSequencesExecutionsRepository.create({
        siteId: sequence.siteId,
        siteExecutionId: nextSiteExecutionId,
        positionId: ciltMstrPositionLevel.positionId,
        ciltId: sequence.ciltMstrId,
        ciltSecuenceId: sequence.id,
        levelId: ciltMstrPositionLevel.levelId,
        route: null,
        userId: generateDto.userId,
        userWhoExecutedId: null,
        specialWarning: sequence.specialWarning,
        machineStatus: null,
        secuenceSchedule: new Date(),
        allowExecuteBefore: true,
        allowExecuteBeforeMinutes: 30,
        toleranceBeforeMinutes: 5,
        toleranceAfterMinutes: 15,
        allowExecuteAfterDue: true,
        secuenceStart: null,
        secuenceStop: null,
        duration: sequence.standardTime,
        realDuration: null,
        standardOk: sequence.standardOk,
        initialParameter: null,
        evidenceAtCreation: false,
        finalParameter: null,
        evidenceAtFinal: false,
        nok: false,
        stoppageReason: sequence.stoppageReason === 1,
        machineStopped: sequence.machineStopped === 1,
        amTagId: null,
        referencePoint: sequence.referencePoint,
        secuenceList: sequence.secuenceList,
        secuenceColor: sequence.secuenceColor,
        ciltTypeId: sequence.ciltTypeId,
        ciltTypeName: sequence.ciltTypeName,
        referenceOplSopId: sequence.referenceOplSopId,
        remediationOplSopId: sequence.remediationOplSopId,
        toolsRequiered: sequence.toolsRequired,
        selectableWithoutProgramming: sequence.selectableWithoutProgramming === 1,
        status: 'A'
      });

      return await this.ciltSequencesExecutionsRepository.save(newExecution);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getOfDay = async (user: any) => {
    try {
      this.logger.logProcess('[GET_OF_DAY] Starting getOfDay method', { userId: user?.id, timezone: user?.timezone });
      
      const timezone = user?.timezone || 'UTC';

      // Get today's date in the USER'S timezone, not UTC
      const nowInUserTimezone = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());

      const today = nowInUserTimezone; // This is YYYY-MM-DD in user's timezone

      this.logger.logProcess('[GET_OF_DAY] Timezone and date info', { timezone, today, userLocalDate: today });

      const { dayStart, dayEnd } = getUTCRangeFromLocalDate(today, timezone);
      
      this.logger.logProcess('[GET_OF_DAY] UTC range calculated', { 
        dayStart: dayStart.toISOString(), 
        dayEnd: dayEnd.toISOString(), 
        timezone,
        localDate: today
      });
      
      const executions = await this.ciltSequencesExecutionsRepository.find({
        where: {
          userId: user.id,
          secuenceSchedule: Between(dayStart, dayEnd),
          deletedAt: IsNull()
        },
        relations: [
          'evidences',
          'referenceOplSop',
          'remediationOplSop',
          'position',
          'ciltMstr',
          'site',
          'ciltSequence'
        ],
        order: {
          secuenceSchedule: 'ASC'
        }
      });

      this.logger.logProcess('[GET_OF_DAY] Executions found', { count: executions?.length });

      if (!executions || executions.length === 0) {
        return {
          userInfo: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          positions: []
        };
      }

      // Group executions by position
      const positionsMap = new Map();

      for (const execution of executions) {
        const positionId = execution.positionId || 'unknown';
        const ciltId = execution.ciltId || 'unknown';

        if (!positionsMap.has(positionId)) {
          positionsMap.set(positionId, {
            id: execution.positionId,
            name: execution.position?.name || 'Unknown Position',
            siteName: execution.site?.name || 'Unknown Site',
            areaName: execution.position?.areaName || 'Unknown Area',
            ciltMasters: new Map()
          });
        }

        const position = positionsMap.get(positionId);
        
        if (!position.ciltMasters.has(ciltId)) {
          position.ciltMasters.set(ciltId, {
            id: execution.ciltId,
            siteId: execution.siteId,
            ciltName: execution.ciltMstr?.ciltName || 'Unknown CILT',
            ciltDescription: execution.ciltMstr?.ciltDescription || 'No description available',
            creatorId: execution.ciltMstr?.creatorId,
            creatorName: execution.ciltMstr?.creatorName,
            reviewerId: execution.ciltMstr?.reviewerId,
            reviewerName: execution.ciltMstr?.reviewerName,
            approvedById: execution.ciltMstr?.approvedById,
            approvedByName: execution.ciltMstr?.approvedByName,
            ciltDueDate: execution.ciltMstr?.ciltDueDate,
            standardTime: execution.ciltMstr?.standardTime || 0,
            urlImgLayout: execution.ciltMstr?.urlImgLayout,
            order: 1,
            status: execution.ciltMstr?.status || 'A',
            dateOfLastUsed: execution.ciltMstr?.dateOfLastUsed,
            createdAt: execution.ciltMstr?.createdAt,
            updatedAt: execution.ciltMstr?.updatedAt,
            deletedAt: null,
            sequences: new Map()
          });
        }

        const ciltMaster = position.ciltMasters.get(ciltId);
        const sequenceId = execution.ciltSecuenceId || 'unknown';

        if (!ciltMaster.sequences.has(sequenceId)) {
          // Use data from CiltSequencesEntity (ciltSequence relation)
          const sequence = execution.ciltSequence;
          ciltMaster.sequences.set(sequenceId, {
            id: sequence?.id || execution.ciltSecuenceId,
            siteId: sequence?.siteId || execution.siteId,
            siteName: sequence?.siteName || execution.site?.name || '',
            ciltMstrId: sequence?.ciltMstrId || execution.ciltId,
            ciltMstrName: sequence?.ciltMstrName || execution.ciltMstr?.ciltName || 'Unknown CILT',
            frecuencyId: sequence?.frecuencyId,
            frecuencyCode: sequence?.frecuencyCode || 'IT',
            referencePoint: sequence?.referencePoint || '1',
            order: sequence?.order || 1,
            secuenceList: sequence?.secuenceList || 'No sequence description',
            secuenceColor: sequence?.secuenceColor || '00ccff',
            ciltTypeId: sequence?.ciltTypeId,
            ciltTypeName: sequence?.ciltTypeName,
            referenceOplSopId: sequence?.referenceOplSopId,
            standardTime: sequence?.standardTime || 0,
            standardOk: sequence?.standardOk || 'Complete tasks',
            remediationOplSopId: sequence?.remediationOplSopId,
            toolsRequired: sequence?.toolsRequired || 'Mobile',
            stoppageReason: sequence?.stoppageReason || 0,
            machineStopped: sequence?.machineStopped || 0,
            specialWarning: sequence?.specialWarning,
            quantityPicturesCreate: sequence?.quantityPicturesCreate || 1,
            quantityPicturesClose: sequence?.quantityPicturesClose || 1,
            selectableWithoutProgramming: sequence?.selectableWithoutProgramming || 0,
            status: sequence?.status || 'A',
            createdAt: sequence?.createdAt,
            updatedAt: sequence?.updatedAt,
            deletedAt: sequence?.deletedAt,
            executions: []
          });
        }

        // Add the execution to the sequence
        ciltMaster.sequences.get(sequenceId).executions.push(execution);
      }

      // Convert Maps to arrays
      const positions = Array.from(positionsMap.values()).map((position: any) => ({
        id: position.id,
        name: position.name,
        siteName: position.siteName,
        areaName: position.areaName,
        ciltMasters: Array.from(position.ciltMasters.values()).map((ciltMaster: any) => ({
          id: ciltMaster.id,
          siteId: ciltMaster.siteId,
          ciltName: ciltMaster.ciltName,
          ciltDescription: ciltMaster.ciltDescription,
          creatorId: ciltMaster.creatorId,
          creatorName: ciltMaster.creatorName,
          reviewerId: ciltMaster.reviewerId,
          reviewerName: ciltMaster.reviewerName,
          approvedById: ciltMaster.approvedById,
          approvedByName: ciltMaster.approvedByName,
          ciltDueDate: ciltMaster.ciltDueDate,
          standardTime: ciltMaster.standardTime,
          urlImgLayout: ciltMaster.urlImgLayout,
          order: ciltMaster.order,
          status: ciltMaster.status,
          dateOfLastUsed: ciltMaster.dateOfLastUsed,
          createdAt: ciltMaster.createdAt,
          updatedAt: ciltMaster.updatedAt,
          deletedAt: ciltMaster.deletedAt,
          sequences: Array.from(ciltMaster.sequences.values())
        }))
      }));

      return {
        userInfo: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        positions
      };
    } catch (exception) {
      this.logger.logException('CiltSequencesExecutionsService', 'getOfDay', exception);
      HandleException.exception(exception);
    }
  };
} 