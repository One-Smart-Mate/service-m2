import { SiteEntity } from '../../site/entities/site.entity';
import {
  assertSiteTimezone,
  DEFAULT_SITE_TIMEZONE,
  ciltScheduledInstant,
  ciltSiteDayRange,
} from '../../../utils/cilt-timezone.utils';
import { sanitizeExecutionRelations } from '../../CiltSequencesExecutions/cilt-execution-relations.policy';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Between } from 'typeorm';
import { CiltSequencesExecutionsEntity } from 'src/modules/CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import { CiltSequencesEntity } from 'src/modules/ciltSequences/entities/ciltSequences.entity';
import { CiltMstrPositionLevelsEntity } from 'src/modules/ciltMstrPositionLevels/entities/ciltMstrPositionLevels.entity';
import { CiltExecutionPersistence } from '../../CiltSequencesExecutions/cilt-execution.persistence';
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
    private readonly executionPersistence: CiltExecutionPersistence,
    @InjectRepository(SiteEntity)
    private readonly siteRepository: Repository<SiteEntity>,
  ) {}

  /**
   * Convert schedule entities to schedule details
   */
  static adaptScheduleEntitiesToDetails(
    scheduleEntities: any[],
  ): ScheduleDetails[] {
    return scheduleEntities.map((entity) => ({
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
    levelPaths: Array<{ ciltMstrId: number; levelId: number; route: string }>,
  ): Promise<void> {
    this.logger.logProcess('STARTING UPSERT EXECUTIONS FOR USER', {
      userId,
      levelsCount: validCiltPositionLevels.length,
      scheduledSequencesCount: scheduledSequences.length,
    });

    const timezones = await this.getSiteTimezones(
      validCiltPositionLevels.map((cpl) => cpl.siteId),
    );
    for (const cpl of validCiltPositionLevels) {
      const masterId = cpl.ciltMstrId;

      // Iterate over each scheduled sequence individually
      for (const scheduleDetails of scheduledSequences) {
        // Skip if this schedule is not for the current CILT master
        if (scheduleDetails.ciltId !== masterId) continue;

        // Find the corresponding sequence entity
        const seq = ciltSequences.find(
          (s) =>
            s.ciltMstrId === masterId && s.id === scheduleDetails.secuenceId,
        );
        if (!seq) continue;

        const executionDate = this.buildExecutionDate(
          scheduleDate,
          scheduleDetails,
          timezones.get(Number(cpl.siteId)),
        );

        await this.upsertSingleExecution(
          cpl,
          seq,
          userId,
          executionDate,
          scheduleDetails,
          levelPaths,
          timezones.get(Number(cpl.siteId)),
        );
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
    levelPaths?: Array<{
      ciltMstrId: number;
      levelId: number;
      route: string | null;
    }>,
  ): Promise<void> {
    this.logger.logProcess('STARTING UPSERT EXECUTIONS FOR SITE', {
      levelsCount: ciltPositionLevels.length,
      scheduledSequencesCount: scheduledSequences.length,
    });

    const timezones = await this.getSiteTimezones(
      ciltPositionLevels.map((cpl) => cpl.siteId),
    );
    for (const cpl of ciltPositionLevels) {
      const users = usersByPosition.get(cpl.positionId) || [];
      const masterId = cpl.ciltMstrId;

      for (const user of users) {
        // Iterate over each scheduled sequence individually
        for (const scheduleDetails of scheduledSequences) {
          // Skip if this schedule is not for the current CILT master
          if (scheduleDetails.ciltId !== masterId) continue;

          // Find the corresponding sequence entity
          const seq = ciltSequences.find(
            (s) =>
              s.ciltMstrId === masterId && s.id === scheduleDetails.secuenceId,
          );
          if (!seq) continue;

          const executionDate = this.buildExecutionDate(
            scheduleDate,
            scheduleDetails,
            timezones.get(Number(cpl.siteId)),
          );

          await this.upsertSingleExecution(
            cpl,
            seq,
            user.id,
            executionDate,
            scheduleDetails,
            levelPaths,
            timezones.get(Number(cpl.siteId)),
          );
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
    userId?: number,
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

    this.logger.logProcess('RETRIEVED CILT EXECUTIONS', {
      count: executions.length,
      userId,
    });
    return executions.map(sanitizeExecutionRelations);
  }

  /**
   * Build the execution date based on the schedule
   */
  private buildExecutionDate(
    scheduleDate: Date,
    scheduleDetails: ScheduleDetails,
    timezone: string,
  ): Date {
    return ciltScheduledInstant(
      scheduleDate.toISOString().slice(0, 10),
      scheduleDetails?.schedule ?? '00:00:00',
      timezone,
    );
  }

  private async getSiteTimezones(siteIds: number[]) {
    const result = new Map<number, string>();
    for (const id of [...new Set(siteIds.map(Number))]) {
      const site = await this.siteRepository.findOne({
        where: { id, status: 'A', deletedAt: IsNull() },
      });
      if (!site) throw new BadRequestException('CILT site must be active');
      result.set(
        id,
        assertSiteTimezone(site.timezone || DEFAULT_SITE_TIMEZONE),
      );
    }
    return result;
  }

  async getExecutionsForLocalDate(
    ciltMasterIds: number[],
    date: string,
    siteIds: number[],
    userId?: number,
  ) {
    if (!ciltMasterIds.length || !siteIds.length) return [];
    const timezones = await this.getSiteTimezones(siteIds);
    const where = [...timezones].map(([siteId, timezone]) => {
      const { dayStart, dayEnd } = ciltSiteDayRange(date, timezone);
      return {
        siteId,
        ciltId: In(ciltMasterIds),
        deletedAt: IsNull(),
        secuenceSchedule: Between(dayStart, dayEnd),
        ...(userId ? { userId } : {}),
      };
    });
    const executions = await this.ciltSequencesExecutionsRepository.find({
      where,
      relations: ['evidences', 'referenceOplSop', 'remediationOplSop'],
      order: { secuenceStart: 'ASC' },
    });
    return executions.map(sanitizeExecutionRelations);
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
    levelPaths?: Array<{ ciltMstrId: number; levelId: number; route: string }>,
    timezone?: string,
  ): Promise<void> {
    const route = levelPaths?.find(
      (lp) => lp.ciltMstrId === cpl.ciltMstrId && lp.levelId === cpl.levelId,
    )?.route;

    const dto: Partial<CiltSequencesExecutionsEntity> = {
      siteId: cpl.siteId,
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
      referenceOplSopId:
        seq.referenceOplSopId && seq.referenceOplSopId > 0
          ? seq.referenceOplSopId
          : null,
      remediationOplSopId:
        seq.remediationOplSopId && Number(seq.remediationOplSopId) > 0
          ? Number(seq.remediationOplSopId)
          : null,
      toolsRequiered: seq.toolsRequired,
      selectableWithoutProgramming: Boolean(seq.selectableWithoutProgramming),
      status: 'A',
      stoppageReason: Boolean(seq.stoppageReason),
      machineStopped: Boolean(seq.machineStopped),
      duration: seq.standardTime,
      levelId: cpl.levelId,
      route,
      allowExecuteBefore: Boolean(scheduleDetails?.allowExecuteBefore),
      allowExecuteBeforeMinutes:
        scheduleDetails?.allowExecuteBeforeMinutes || null,
      toleranceBeforeMinutes: scheduleDetails?.toleranceBeforeMinutes || null,
      toleranceAfterMinutes: scheduleDetails?.toleranceAfterMinutes || null,
      allowExecuteAfterDue: Boolean(scheduleDetails?.allowExecuteAfterDue),
      specialWarning: seq.specialWarning,
    };

    await this.executionPersistence.create(dto, true, timezone);
  }
}
