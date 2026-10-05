import { sanitizeExecutionRelations } from './cilt-execution-relations.policy';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between } from 'typeorm';
import { ciltLocalDateAt, ciltSiteDayRange, DEFAULT_SITE_TIMEZONE, parseCiltLocalDate } from '../../utils/cilt-timezone.utils';
import { SiteEntity } from '../site/entities/site.entity';
import { CiltSequencesExecutionsEntity } from './entities/ciltSequencesExecutions.entity';
import { CreateCiltSequencesExecutionDTO } from './models/dto/create.ciltSequencesExecution.dto';
import { UpdateCiltSequencesExecutionDTO } from './models/dto/update.ciltSequencesExecution.dto';
import { HandleException } from '../../common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from '../../common/exceptions/types/notFound.exception';
import { UsersService } from '../users/users.service';
import { StartCiltSequencesExecutionDTO } from './models/dto/start.ciltSequencesExecution.dto';
import { StopCiltSequencesExecutionDTO } from './models/dto/stop.ciltSequencesExecution.dto';
import { CiltSequencesEntity } from '../ciltSequences/entities/ciltSequences.entity';
import { CiltSequencesExecutionsEvidencesService } from '../CiltSequencesExecutionsEvidences/ciltSequencesExecutionsEvidences.service';
import { CiltMstrPositionLevelsEntity } from '../ciltMstrPositionLevels/entities/ciltMstrPositionLevels.entity';
import { CiltSequencesExecutionsEvidencesType, CreateCiltSequencesEvidenceDTO } from '../CiltSequencesExecutionsEvidences/models/dtos/createCiltSequencesEvidence.dto';
import { CreateEvidenceDTO } from './models/dto/create.evidence.dto';
import { GenerateCiltSequencesExecutionDTO } from './models/dto/generate.ciltSequencesExecution.dto';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { CiltExecutionPersistence } from './cilt-execution.persistence';
import { CiltExecutionReportsService, CiltReportFilters } from './cilt-execution-reports.service';

@Injectable()
export class CiltSequencesExecutionsService {
  constructor(
    @InjectRepository(CiltSequencesExecutionsEntity)
    private readonly ciltSequencesExecutionsRepository: Repository<CiltSequencesExecutionsEntity>,
    private readonly usersService: UsersService,
    @InjectRepository(CiltSequencesEntity)
    private readonly ciltSequencesRepository: Repository<CiltSequencesEntity>,
    @InjectRepository(CiltMstrPositionLevelsEntity)
    private readonly ciltMstrPositionLevelsRepository: Repository<CiltMstrPositionLevelsEntity>,
    private readonly ciltSequencesExecutionsEvidencesService: CiltSequencesExecutionsEvidencesService,
    private readonly logger: CustomLoggerService,
    private readonly executionPersistence: CiltExecutionPersistence,
    private readonly executionReports: CiltExecutionReportsService,
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

      const site = await this.ciltSequencesExecutionsRepository.manager.findOne(SiteEntity, {
        where: { id: sequence.siteId, status: 'A', deletedAt: IsNull() },
      });
      if (!site) return null;
      const { dayStart, dayEnd } = ciltSiteDayRange(date, site.timezone || DEFAULT_SITE_TIMEZONE);
      const executions = await this.ciltSequencesExecutionsRepository
        .createQueryBuilder('execution')
        .where('execution.ciltSecuenceId = :ciltSequenceId', { ciltSequenceId })
        .andWhere('execution.siteId = :siteId', { siteId: site.id })
        .andWhere('execution.secuenceSchedule BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
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
      return await this.executionPersistence.create(createDTO as any);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateDTO: UpdateCiltSequencesExecutionDTO) => {
    try {
      return await this.executionPersistence.update(updateDTO as any);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  softDelete = async (id: number) => {
    try {
      return await this.executionPersistence.softDelete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  async start(startDTO: StartCiltSequencesExecutionDTO) {
    try {
      await this.executionPersistence.start(startDTO);
      return { generatedMaps: [], raw: [], affected: 1 };
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async stop(stopDTO: StopCiltSequencesExecutionDTO) {
    try {
      return await this.executionPersistence.stop(stopDTO);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async findAllByUserIdAndDate(userId: number, date: string, sessionSiteId?: number) {
    try {
      const conditions = await this.dayConditionsForUser(userId, date, sessionSiteId);
      if (!conditions.length) return [];
      return await this.ciltSequencesExecutionsRepository.find({
        where: conditions.map(condition => ({ ...condition, status: 'I' })),
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

  async getExecutionChart(filters: CiltReportFilters) {
    try {
      return await this.executionReports.execution(filters);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async getComplianceByPersonChart(filters: CiltReportFilters) {
    try {
      return await this.executionReports.compliance(filters);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async getTimeChart(filters: CiltReportFilters) {
    try {
      return await this.executionReports.time(filters);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async getAnomaliesChart(filters: CiltReportFilters) {
    try {
      return await this.executionReports.anomalies(filters);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  generate = async (generateDto: GenerateCiltSequencesExecutionDTO) => {
    try {
      const sequence = await this.ciltSequencesRepository.findOne({
        where: { 
          id: generateDto.sequenceId,
          status: 'A',
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

      const ciltMstrPositionLevel = await this.ciltMstrPositionLevelsRepository
        .createQueryBuilder('assignment')
        .innerJoin('assignment.position', 'position', "position.siteId = assignment.siteId AND position.status = 'A' AND position.deletedAt IS NULL")
        .innerJoin('position.usersPositions', 'userPosition', 'userPosition.userId = :userId AND userPosition.siteId = assignment.siteId AND userPosition.deletedAt IS NULL', { userId: generateDto.userId })
        .where("assignment.ciltMstrId = :masterId AND assignment.siteId = :siteId AND assignment.status = 'A' AND assignment.deletedAt IS NULL", { masterId: sequence.ciltMstrId, siteId: sequence.siteId })
        .orderBy('assignment.id', 'ASC')
        .getOne();

      if (!ciltMstrPositionLevel) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR_POSITION_LEVELS);
      }

      const newExecution = {
        siteId: sequence.siteId,
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
      };

      return await this.executionPersistence.create(newExecution, false, undefined, { assignmentId: Number(ciltMstrPositionLevel.id), sequence });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private async dayConditionsForUser(userId: number, date?: string, sessionSiteId?: number) {
    if (date !== undefined) parseCiltLocalDate(date);
    const sites = await this.ciltSequencesExecutionsRepository.manager.find(SiteEntity, {
      where: { status: 'A', deletedAt: IsNull(), userHasSites: {
        user: { id: userId, status: 'A', deletedAt: IsNull() }, status: 'A', deletedAt: IsNull(),
      } },
    });
    const now = new Date();
    return sites.filter(site => sessionSiteId === undefined || Number(site.id) === Number(sessionSiteId)).map(site => {
      const timezone = site.timezone || DEFAULT_SITE_TIMEZONE;
      const localDate = date ?? ciltLocalDateAt(now, timezone);
      const { dayStart, dayEnd } = ciltSiteDayRange(localDate, timezone);
      return { userId, siteId: site.id, secuenceSchedule: Between(dayStart, dayEnd), deletedAt: IsNull() };
    });
  }

  getOfDay = async (user: any) => {
    try {
      this.logger.logProcess('[GET_OF_DAY] Starting getOfDay method', { userId: user?.id, timezone: user?.timezone });
      
      const conditions = await this.dayConditionsForUser(Number(user.id), undefined, user.fastSiteId);
      const executions = conditions.length ? await this.ciltSequencesExecutionsRepository.find({
        where: conditions,
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
      }) : [];

      executions.forEach(sanitizeExecutionRelations);

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
