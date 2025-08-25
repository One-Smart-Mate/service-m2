import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Between } from 'typeorm';
import { CiltSequencesExecutionsEntity } from 'src/modules/CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import { CiltSequencesEntity } from 'src/modules/ciltSequences/entities/ciltSequences.entity';
import { CiltMstrPositionLevelsEntity } from 'src/modules/ciltMstrPositionLevels/entities/ciltMstrPositionLevels.entity';
import { CustomLoggerService } from 'src/common/logger/logger.service';

export interface ScheduleDetails {
  ciltId: number;
  secuenceId: number;
  schedule?: string;
  allowExecuteBefore?: boolean;
  allowExecuteBeforeMinutes?: number;
  toleranceBeforeMinutes?: number;
  toleranceAfterMinutes?: number;
  allowExecuteAfterDue?: boolean;
}

@Injectable()
export class CiltExecutionService {
  constructor(
    @InjectRepository(CiltSequencesExecutionsEntity)
    private readonly ciltSequencesExecutionsRepository: Repository<CiltSequencesExecutionsEntity>,
    private readonly logger: CustomLoggerService,
  ) {}

  /**
   * Convert schedule entities to schedule details
   */
  static adaptScheduleEntitiesToDetails(scheduleEntities: any[]): ScheduleDetails[] {
    return scheduleEntities.map(entity => ({
      ciltId: entity.ciltId,
      secuenceId: entity.secuenceId,
      schedule: entity.schedule,
      allowExecuteBefore: Boolean(entity.allowExecuteBefore),
      allowExecuteBeforeMinutes: entity.allowExecuteBeforeMinutes,
      toleranceBeforeMinutes: entity.toleranceBeforeMinutes,
      toleranceAfterMinutes: entity.toleranceAfterMinutes,
      allowExecuteAfterDue: Boolean(entity.allowExecuteAfterDue),
    }));
  }

  /**
   * Create or update CILT sequence executions for a specific user
   */
  async upsertExecutionsForUser(
    validCiltPositionLevels: CiltMstrPositionLevelsEntity[],
    ciltSequences: CiltSequencesEntity[],
    scheduledSequences: ScheduleDetails[],
    userId: number,
    scheduleDate: Date,
    levelPaths: Array<{ ciltMstrId: number; levelId: number; route: string }>
  ): Promise<void> {
    this.logger.logProcess('STARTING UPSERT EXECUTIONS FOR USER', { 
      userId, 
      levelsCount: validCiltPositionLevels.length,
      scheduledSequencesCount: scheduledSequences.length
    });

    for (const cpl of validCiltPositionLevels) {
      const masterId = cpl.ciltMstrId;
      
      // Iterate over each scheduled sequence individually
      for (const scheduleDetails of scheduledSequences) {
        // Skip if this schedule is not for the current CILT master
        if (scheduleDetails.ciltId !== masterId) continue;
        
        // Find the corresponding sequence entity
        const seq = ciltSequences.find(s => s.ciltMstrId === masterId && s.id === scheduleDetails.secuenceId);
        if (!seq) continue;

        const executionDate = this.buildExecutionDate(scheduleDate, scheduleDetails);

        await this.upsertSingleExecution(cpl, seq, userId, executionDate, scheduleDetails, levelPaths);
      }
    }
  }

  /**
   * Create or update executions for multiple users in a site
   */
  async upsertExecutionsForSite(
    ciltPositionLevels: CiltMstrPositionLevelsEntity[],
    ciltSequences: CiltSequencesEntity[],
    scheduledSequences: ScheduleDetails[],
    usersByPosition: Map<number, any[]>,
    scheduleDate: Date,
    levelPaths?: Array<{ ciltMstrId: number; levelId: number; route: string | null }>
  ): Promise<void> {
    this.logger.logProcess('STARTING UPSERT EXECUTIONS FOR SITE', { 
      levelsCount: ciltPositionLevels.length,
      scheduledSequencesCount: scheduledSequences.length
    });

    for (const cpl of ciltPositionLevels) {
      const users = usersByPosition.get(cpl.positionId) || [];
      const masterId = cpl.ciltMstrId;
      
      for (const user of users) {
        // Iterate over each scheduled sequence individually
        for (const scheduleDetails of scheduledSequences) {
          // Skip if this schedule is not for the current CILT master
          if (scheduleDetails.ciltId !== masterId) continue;
          
          // Find the corresponding sequence entity
          const seq = ciltSequences.find(s => s.ciltMstrId === masterId && s.id === scheduleDetails.secuenceId);
          if (!seq) continue;

          const executionDate = this.buildExecutionDate(scheduleDate, scheduleDetails);

          await this.upsertSingleExecution(cpl, seq, user.id, executionDate, scheduleDetails, levelPaths);
        }
      }
    }
  }

  /**
   * Get all executions for a specific date
   */
  async getExecutionsForDate(
    ciltMasterIds: number[],
    dayStart: Date,
    dayEnd: Date,
    userId?: number
  ): Promise<CiltSequencesExecutionsEntity[]> {
    const whereCondition: any = {
      ciltId: In(ciltMasterIds),
      deletedAt: IsNull(),
      secuenceSchedule: Between(dayStart, dayEnd),
    };

    if (userId) {
      whereCondition.userId = userId;
    }

    const executions = await this.ciltSequencesExecutionsRepository.find({
      where: whereCondition,
      relations: ['evidences', 'referenceOplSop', 'remediationOplSop'],
      order: { secuenceStart: 'ASC' },
    });

    this.logger.logProcess('RETRIEVED CILT EXECUTIONS', { count: executions.length, userId });
    return executions;
  }

  /**
   * Build the execution date based on the schedule
   */
  private buildExecutionDate(scheduleDate: Date, scheduleDetails?: ScheduleDetails): Date {
    const executionDate = new Date(scheduleDate);
    
    if (scheduleDetails?.schedule) {
      const timeParts = scheduleDetails.schedule.split(':');
      if (timeParts.length === 3) {
        executionDate.setHours(Number(timeParts[0]));
        executionDate.setMinutes(Number(timeParts[1]));
        executionDate.setSeconds(Number(timeParts[2]));
      }
    }
    
    return executionDate;
  }

  /**
   * Create or update an individual execution
   */
  private async upsertSingleExecution(
    cpl: CiltMstrPositionLevelsEntity,
    seq: CiltSequencesEntity,
    userId: number,
    executionDate: Date,
    scheduleDetails?: ScheduleDetails,
    levelPaths?: Array<{ ciltMstrId: number; levelId: number; route: string }>
  ): Promise<void> {
    const existing = await this.ciltSequencesExecutionsRepository.findOne({
      where: {
        ciltId: cpl.ciltMstrId,
        ciltSecuenceId: seq.id,
        userId,
        secuenceSchedule: executionDate,
        deletedAt: IsNull(),
      }
    });

    if (existing) {
      if (existing.secuenceStart && existing.secuenceStop) {
        this.logger.logProcess('SKIPPING COMPLETED EXECUTION', { 
          id: existing.id, 
          secuenceStart: existing.secuenceStart, 
          secuenceStop: existing.secuenceStop 
        });
        return;
      }
      
      await this.ciltSequencesExecutionsRepository.save(existing);
      this.logger.logProcess('UPDATED CILT SEQUENCES EXECUTION', { id: existing.id });
    } else {
      // Get the next execution ID in real time
      const nextSiteExecutionId = await this.getNextSiteExecutionId(cpl.siteId);
      const route = levelPaths?.find(lp => lp.levelId === cpl.levelId)?.route;

      const dto: Partial<CiltSequencesExecutionsEntity> = {
        siteId: cpl.siteId,
        siteExecutionId: nextSiteExecutionId,
        positionId: cpl.positionId,
        ciltId: cpl.ciltMstrId,
        ciltSecuenceId: seq.id,
        userId,
        userWhoExecutedId: userId,
        secuenceSchedule: executionDate,
        standardOk: seq.standardOk,
        referencePoint: seq.referencePoint,
        secuenceList: seq.secuenceList,
        secuenceColor: seq.secuenceColor,
        ciltTypeId: seq.ciltTypeId,
        ciltTypeName: seq.ciltTypeName,
        referenceOplSopId: seq.referenceOplSopId && seq.referenceOplSopId > 0 ? seq.referenceOplSopId : null,
        remediationOplSopId: seq.remediationOplSopId && Number(seq.remediationOplSopId) > 0 ? Number(seq.remediationOplSopId) : null,
        toolsRequiered: seq.toolsRequired,
        selectableWithoutProgramming: Boolean(seq.selectableWithoutProgramming),
        status: 'A',
        stoppageReason: Boolean(seq.stoppageReason),
        machineStopped: Boolean(seq.machineStopped),
        duration: seq.standardTime,
        levelId: cpl.levelId,
        route,
        allowExecuteBefore: Boolean(scheduleDetails?.allowExecuteBefore),
        allowExecuteBeforeMinutes: scheduleDetails?.allowExecuteBeforeMinutes || null,
        toleranceBeforeMinutes: scheduleDetails?.toleranceBeforeMinutes || null,
        toleranceAfterMinutes: scheduleDetails?.toleranceAfterMinutes || null,
        allowExecuteAfterDue: Boolean(scheduleDetails?.allowExecuteAfterDue),
        specialWarning: seq.specialWarning,
      };

      const created = await this.ciltSequencesExecutionsRepository.save(dto as CiltSequencesExecutionsEntity);
      this.logger.logProcess('CREATED CILT SEQUENCES EXECUTION', { id: created.id });
    }
  }

  /**
   * Search for the last site_execution_id for a specific site at the time of insertion
   */
  private async getNextSiteExecutionId(siteId: number): Promise<number> {
    this.logger.logProcess('GETTING NEXT SITE EXECUTION ID', { siteId });
    
    // Search for the last site_execution_id for this site
    const lastExecution = await this.ciltSequencesExecutionsRepository.findOne({
      where: { siteId },
      order: { siteExecutionId: 'DESC' },
      select: ['siteExecutionId']
    });
    
    const nextId = lastExecution ? lastExecution.siteExecutionId + 1 : 1;
    
    this.logger.logProcess('CALCULATED NEXT SITE EXECUTION ID', { 
      siteId, 
      lastId: lastExecution?.siteExecutionId || 0,
      nextId 
    });
    
    return nextId;
  }
} 