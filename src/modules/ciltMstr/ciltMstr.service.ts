import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltMstrEntity } from './entities/ciltMstr.entity';
import { CreateCiltMstrDTO } from './models/dto/create.ciltMstr.dto';
import { UpdateCiltMstrDTO } from './models/dto/update.ciltMstr.dto';
import { UpdateCiltOrderDTO } from './models/dto/update-order.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { CiltSequencesEntity } from '../ciltSequences/entities/ciltSequences.entity';
import { CiltSequencesExecutionsEntity } from '../CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import { CiltSecuencesScheduleService } from '../ciltSecuencesSchedule/ciltSecuencesSchedule.service';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { CiltExecutionService } from './services/cilt-execution.service';
import { CiltPositionLevelService } from './services/cilt-position-level.service';
import { CiltValidationService } from './services/cilt-validation.service';
import { CiltQueryBuilderService, CiltUserResponse, CiltSiteResponse } from './services/cilt-query-builder.service';
import { CiltQueryService } from './services/cilt-query.service';
import { getUTCRangeFromLocalDate } from 'src/utils/timezone.utils';

@Injectable()
export class CiltMstrService {
  constructor(
    @InjectRepository(CiltMstrEntity)
    private readonly ciltRepository: Repository<CiltMstrEntity>,
    @InjectRepository(CiltSequencesEntity)
    private readonly ciltSequencesRepository: Repository<CiltSequencesEntity>,
    @InjectRepository(OplMstr)
    private readonly oplMstrRepository: Repository<OplMstr>,
    private readonly ciltSecuencesScheduleService: CiltSecuencesScheduleService,
    private readonly logger: CustomLoggerService, 
    private readonly ciltExecutionService: CiltExecutionService,
    private readonly ciltPositionLevelService: CiltPositionLevelService,
    private readonly ciltValidationService: CiltValidationService,
    private readonly ciltQueryBuilderService: CiltQueryBuilderService,
    private readonly ciltQueryService: CiltQueryService,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltQueryService.getAllCilts();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltQueryService.getCiltsBySiteId(siteId);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const cilt = await this.ciltQueryService.getCiltById(id);
      if (!cilt) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }
      return cilt;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createCiltDto: CreateCiltMstrDTO) => {
    try {
      // Obtener el próximo número de orden
      const nextOrder = await this.ciltQueryService.getNextOrderForSite(createCiltDto.siteId);
      createCiltDto.order = nextOrder;

      const cilt = this.ciltRepository.create(createCiltDto);
      return await this.ciltRepository.save(cilt);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateCiltDto: UpdateCiltMstrDTO) => {
    try {
      const cilt = await this.ciltRepository.findOneBy({
        id: updateCiltDto.id,
      });
      if (!cilt) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }

      Object.assign(cilt, updateCiltDto);
      return await this.ciltRepository.save(cilt);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  updateOrder = async (updateOrderDto: UpdateCiltOrderDTO) => {
    try {
      // Find the CILT to update
      const ciltToUpdate = await this.ciltRepository.findOneBy({
        id: updateOrderDto.ciltMstrId,
      });
      if (!ciltToUpdate) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }

      // Find the CILT that currently has the new order
      const ciltWithNewOrder = await this.ciltRepository.findOne({
        where: {
          siteId: ciltToUpdate.siteId,
          order: updateOrderDto.newOrder,
        },
      });

      if (ciltWithNewOrder) {
        // Swap orders
        const oldOrder = ciltToUpdate.order;
        ciltToUpdate.order = updateOrderDto.newOrder;
        ciltWithNewOrder.order = oldOrder;

        // Save both CILTs
        await this.ciltRepository.save(ciltWithNewOrder);
        return await this.ciltRepository.save(ciltToUpdate);
      } else {
        // If no CILT has the new order, just update the order
        ciltToUpdate.order = updateOrderDto.newOrder;
        return await this.ciltRepository.save(ciltToUpdate);
      }
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  async findCiltsByUserId(userId: number, date: string, timezone?: string): Promise<CiltUserResponse> {
    try {
      this.logger.logProcess('STARTING FIND CILTS BY USER ID', { userId, date, timezone });
      
      // Validate date format
      const scheduleDate = this.ciltValidationService.validateDateFormat(date);

      // Usar utilidad de timezone para calcular el rango correcto
      const { dayStart, dayEnd } = getUTCRangeFromLocalDate(date, timezone);

      this.logger.logProcess('TIMEZONE RANGE CALCULATED', { 
        originalDate: date, 
        timezone, 
        dayStart: dayStart.toISOString(), 
        dayEnd: dayEnd.toISOString() 
      });
  
      // 1) Validate and get user
      const user = await this.ciltValidationService.validateUser(userId);
  
      // 2) Get user positions
      const userPositions = await this.ciltPositionLevelService.getUserPositions(userId);
      if (!userPositions.length) {
        return { userInfo: { id: user.id, name: user.name, email: user.email }, positions: [] };
      }
  
      // 3) Get active levels for those positions
      const positionIds = userPositions.map(up => up.position.id);
      const ciltPositionLevels = await this.ciltPositionLevelService.getActiveLevelsForPositions(positionIds);
      
      // Filter valid levels (without null ciltMstr)
      const validCiltPositionLevels = this.ciltPositionLevelService.filterValidPositionLevels(ciltPositionLevels);
      
      if (!validCiltPositionLevels.length) {
        return { userInfo: { id: user.id, name: user.name, email: user.email }, positions: [] };
      }
      
      // Get level paths
      const levelPaths = await this.ciltPositionLevelService.getLevelPaths(validCiltPositionLevels);
  
      // 4) Extract unique CILT masters
      const ciltMasters = this.ciltQueryBuilderService.extractUniqueCiltMasters(validCiltPositionLevels);
      
      if (!ciltMasters.length) {
        return { userInfo: { id: user.id, name: user.name, email: user.email }, positions: [] };
      }
  
      // 5) Get active sequences for those CILTs
      const ciltSequences = await this.ciltQueryService.getActiveSequencesForCilts(
        ciltMasters.map(cm => cm.id)
      );
  
      // 6) Validate SOP references
      await this.ciltValidationService.validateSopReferences(ciltSequences);
  
      // 7) Get scheduled sequences for the date
      const scheduledSequenceEntities = await this.ciltSecuencesScheduleService.findSchedulesForDate(date);
      const scheduledSequences = CiltExecutionService.adaptScheduleEntitiesToDetails(scheduledSequenceEntities);
  
      // 8) Create/update executions
      await this.ciltExecutionService.upsertExecutionsForUser(
        validCiltPositionLevels,
        ciltSequences,
        scheduledSequences,
        userId,
        scheduleDate,
        levelPaths
      );
  
      // 9) Get
      const allExecutions = await this.ciltExecutionService.getExecutionsForDate(
        ciltMasters.map(cm => cm.id),
        dayStart,
        dayEnd,
        userId
      );
  
      // 10) Build and return response
      const response = this.ciltQueryBuilderService.buildUserCiltResponse(
        user,
        userPositions,
        validCiltPositionLevels,
        ciltSequences,
        allExecutions,
        levelPaths
      );

      this.logger.logProcess('COMPLETED FIND CILTS BY USER ID', { 
        userId, 
        positionsCount: response.positions.length,
        timezone,
        executionsFound: allExecutions.length 
      });
      
      return response;
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async findCiltsByUserIdReadOnly(userId: number, date: string, timezone?: string): Promise<CiltUserResponse> {
    try {
      this.logger.logProcess('STARTING FIND CILTS BY USER ID (READ ONLY)', { userId, date, timezone });
      
      // Validate date format
      const scheduleDate = this.ciltValidationService.validateDateFormat(date);
      console.log(`Unused variable: ${scheduleDate}`)

      // Usar utilidad de timezone para calcular el rango correcto
      const { dayStart, dayEnd } = getUTCRangeFromLocalDate(date, timezone);

      this.logger.logProcess('TIMEZONE RANGE CALCULATED', { 
        originalDate: date, 
        timezone, 
        dayStart: dayStart.toISOString(), 
        dayEnd: dayEnd.toISOString() 
      });
  
      // 1) Validate and get user
      const user = await this.ciltValidationService.validateUser(userId);
  
      // 2) Get user positions
      const userPositions = await this.ciltPositionLevelService.getUserPositions(userId);
      if (!userPositions.length) {
        return { userInfo: { id: user.id, name: user.name, email: user.email }, positions: [] };
      }
  
      // 3) Get active levels for those positions
      const positionIds = userPositions.map(up => up.position.id);
      const ciltPositionLevels = await this.ciltPositionLevelService.getActiveLevelsForPositions(positionIds);
      
      // Filter valid levels (without null ciltMstr)
      const validCiltPositionLevels = this.ciltPositionLevelService.filterValidPositionLevels(ciltPositionLevels);
      
      if (!validCiltPositionLevels.length) {
        return { userInfo: { id: user.id, name: user.name, email: user.email }, positions: [] };
      }
      
      // Get level paths
      const levelPaths = await this.ciltPositionLevelService.getLevelPaths(validCiltPositionLevels);
  
      // 4) Extract unique CILT masters
      const ciltMasters = this.ciltQueryBuilderService.extractUniqueCiltMasters(validCiltPositionLevels);
      
      if (!ciltMasters.length) {
        return { userInfo: { id: user.id, name: user.name, email: user.email }, positions: [] };
      }
  
      // 5) Get active sequences for those CILTs
      const ciltSequences = await this.ciltQueryService.getActiveSequencesForCilts(
        ciltMasters.map(cm => cm.id)
      );
  
      // 7) Get executions (READ ONLY - no creation/update)
      const allExecutions = await this.ciltExecutionService.getExecutionsForDate(
        ciltMasters.map(cm => cm.id),
        dayStart,
        dayEnd,
        userId
      );

      // Update OPL usage counters from CILT executions
      await this.updateOplUsageCountersFromCilt(allExecutions);
  
      // 8) Build and return response
      const response = this.ciltQueryBuilderService.buildUserCiltResponse(
        user,
        userPositions,
        validCiltPositionLevels,
        ciltSequences,
        allExecutions,
        levelPaths
      );

      this.logger.logProcess('COMPLETED FIND CILTS BY USER ID (READ ONLY)', { 
        userId, 
        positionsCount: response.positions.length,
        timezone,
        executionsFound: allExecutions.length 
      });
      
      return response;
    } catch (error) {
      HandleException.exception(error);
    }
  }
  
  findCiltDetailsById = async (ciltMstrId: number) => {
    try {
      const ciltMstr = await this.ciltRepository.findOneBy({ id: ciltMstrId });
      if (!ciltMstr) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }

      const ciltSequences = await this.ciltQueryService.getSequencesForCilt(ciltMstrId);

      // Get all sequence IDs
      const sequenceIds = ciltSequences.map(sequence => sequence.id);
      console.log(sequenceIds)

      // Get executions for all sequences
      const allExecutions = await this.ciltExecutionService.getExecutionsForDate(
        [ciltMstrId],
        new Date(0), // From beginning of time
        new Date() // To now
      );

      // Map executions to their respective sequences
      const sequencesWithExecutions = ciltSequences.map(sequence => {
        const sequenceExecutions = allExecutions.filter(
          exec => exec.ciltSecuenceId === sequence.id
        );

        return {
          ...sequence,
          executions: sequenceExecutions
        };
      });

      return {
        ciltInfo: {
          ...ciltMstr
        },
        sequences: sequencesWithExecutions
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  async findCiltsBySiteId(siteId: number, date: string): Promise<CiltSiteResponse> {
    try {
      this.logger.logProcess('STARTING FIND CILTS BY SITE ID', { siteId, date });
      
      // Validate date format
      const scheduleDate = this.ciltValidationService.validateDateFormat(date);

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
  
      // 1) Get all active CILTs for the site
      const ciltMasters = await this.ciltQueryService.getActiveCiltsForSite(siteId);
      if (!ciltMasters.length) {
        return { siteId, date, executions: [], total: 0 };
      }

      // 2) Get all sequences for these CILTs
      const ciltSequences = await this.ciltQueryService.getActiveSequencesForCilts(
        ciltMasters.map(cm => cm.id)
      );

      // 3) Validate SOP references
      await this.ciltValidationService.validateSopReferences(ciltSequences);

      // 4) Get active position levels for these CILTs
      const ciltPositionLevels = await this.ciltPositionLevelService.getActiveLevelsForCilts(
        ciltMasters.map(cm => cm.id)
      );

      // Get level paths
      const levelPaths = await this.ciltPositionLevelService.getLevelPaths(ciltPositionLevels);

      // 5) Get all users with these positions
      const positionIds = this.ciltPositionLevelService.extractUniquePositionIds(ciltPositionLevels);
      const userPositions = await this.ciltPositionLevelService.getUsersWithPositions(positionIds);

      // 6) Get scheduled sequences for the date
      const scheduledSequenceEntities = await this.ciltSecuencesScheduleService.findSchedulesForDate(date);
      const scheduledSequences = CiltExecutionService.adaptScheduleEntitiesToDetails(scheduledSequenceEntities);

      // 7) Group users by position
      const usersByPosition = this.ciltPositionLevelService.groupUsersByPosition(userPositions);

      // 8) Create/update executions for each user and position
      await this.ciltExecutionService.upsertExecutionsForSite(
        ciltPositionLevels,
        ciltSequences,
        scheduledSequences,
        usersByPosition,
        scheduleDate,
        levelPaths
      );

      // 9) Read all executions for the date
      const allExecutions = await this.ciltExecutionService.getExecutionsForDate(
        ciltMasters.map(cm => cm.id),
        dayStart,
        dayEnd
      );

      // 10) Build
      const response = this.ciltQueryBuilderService.buildSiteCiltResponse(
        siteId,
        date,
        allExecutions,
        levelPaths
      );

      this.logger.logProcess('COMPLETED FIND CILTS BY SITE ID', { 
        siteId, 
        totalExecutions: response.total 
      });
      
      return response;
    } catch (error) {
      HandleException.exception(error);
    }
  }

  async cloneCiltMaster(id: number) {
    try {
      // 1. Find the original CILT master
      const originalCilt = await this.ciltRepository.findOne({
        where: { id },
        relations: ['sequences']
      });
      if (!originalCilt) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }

      // 2. Get the next available order for sequences
      const lastSequence = await this.ciltSequencesRepository.findOne({
        where: { siteId: originalCilt.siteId },
        order: { order: 'DESC' }
      });
      let nextSequenceOrder = lastSequence ? lastSequence.order + 1 : 1;

      // 3. Start a transaction
      const queryRunner = this.ciltRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 4. Create a new CILT master with the same data
        const { id: originalId, sequences, createdAt, updatedAt, deletedAt, ...ciltData } = originalCilt;

        console.log(`Unused variable: ${originalId} - ${createdAt} - ${updatedAt} - ${deletedAt}`)

        const newCilt = this.ciltRepository.create({
          ...ciltData,
          ciltName: `${ciltData.ciltName} (Copy)`,
          order: await this.getNextOrder(ciltData.siteId)
        });
        const savedCilt = await queryRunner.manager.save(CiltMstrEntity, newCilt);

        // 5. Clone all sequences sequentially
        const clonedSequences = [];
        for (const sequence of sequences) {
          const { id: seqId, createdAt: seqCreatedAt, updatedAt: seqUpdatedAt, deletedAt: seqDeletedAt, ...seqData } = sequence;
          console.log(`Unused variable: ${seqId} - ${seqCreatedAt} - ${seqUpdatedAt} - ${seqDeletedAt}`)

          const newSequence = this.ciltSequencesRepository.create({
            ...seqData,
            ciltMstrId: savedCilt.id,
            order: nextSequenceOrder++
          });
          const savedSequence = await queryRunner.manager.save(CiltSequencesEntity, newSequence);
          clonedSequences.push(savedSequence);
        }

        // 6. Commit the transaction
        await queryRunner.commitTransaction();

        return {
          ciltMaster: savedCilt,
          sequences: clonedSequences
        };
      } catch (error) {
        // 7. Rollback in case of error
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // 8. Release the query runner
        await queryRunner.release();
      }
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  private async getNextOrder(siteId: number): Promise<number> {
    return await this.ciltQueryService.getNextOrderForSite(siteId);
  }

  async softDelete(id: number){
    try{
      const cilt = await this.ciltRepository.findOneBy({ id });
      if (!cilt) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }
      return await this.ciltRepository.softDelete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  /**
   * Updates the CILT usage counters for OPLs referenced in CILT executions
   * @param executions Array of CILT executions that may reference OPLs
   */
  private async updateOplUsageCountersFromCilt(executions: CiltSequencesExecutionsEntity[]): Promise<void> {
    try {
      // Extract unique OPL IDs from both reference and remediation OPLs
      const oplIds = new Set<number>();
      
      executions.forEach(execution => {
        if (execution.referenceOplSopId) {
          oplIds.add(execution.referenceOplSopId);
        }
        if (execution.remediationOplSopId) {
          oplIds.add(execution.remediationOplSopId);
        }
      });

      if (oplIds.size === 0) {
        return;
      }

      const currentTime = new Date();
      const oplIdsArray = Array.from(oplIds);

      // Update CILT usage counter for all referenced OPLs
      await this.oplMstrRepository
        .createQueryBuilder()
        .update(OplMstr)
        .set({
          ciltUsageCount: () => 'COALESCE(cilt_usage_count, 0) + 1',
          lastUsedAt: currentTime
        })
        .whereInIds(oplIdsArray)
        .execute();

      this.logger.logProcess('UPDATED OPL CILT USAGE COUNTERS', { 
        oplIds: oplIdsArray,
        count: oplIdsArray.length 
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
}
