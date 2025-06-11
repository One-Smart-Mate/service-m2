import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CiltSecuencesScheduleEntity } from './entities/ciltSecuencesSchedule.entity';
import { CreateCiltSecuencesScheduleDto } from './models/dto/create.ciltSecuencesSchedule.dto';
import { UpdateCiltSecuencesScheduleDto } from './models/dto/update.ciltSecuencesSchedule.dto';
import { UpdateScheduleOrderDTO } from './models/dto/update-order.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { ValidationException, ValidationExceptionType } from 'src/common/exceptions/types/validation.exception';
import { stringConstants } from 'src/utils/string.constant';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { CiltSequencesEntity } from '../ciltSequences/entities/ciltSequences.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { CiltMstrService } from '../ciltMstr/ciltMstr.service';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { CiltSequencesExecutionsEntity } from '../ciltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import { IsNull } from 'typeorm';

@Injectable()
export class CiltSecuencesScheduleService {
  constructor(
    @InjectRepository(CiltSecuencesScheduleEntity)
    private readonly ciltSecuencesScheduleRepository: Repository<CiltSecuencesScheduleEntity>,
    @InjectRepository(CiltMstrEntity)
    private readonly ciltMstrRepository: Repository<CiltMstrEntity>,
    @InjectRepository(CiltSequencesEntity)
    private readonly ciltSequencesRepository: Repository<CiltSequencesEntity>,
    @InjectRepository(SiteEntity)
    private readonly siteRepository: Repository<SiteEntity>,
    @Inject(forwardRef(() => CiltMstrService))
    private readonly ciltMstrService: CiltMstrService,
    private readonly logger: CustomLoggerService,
    @InjectRepository(CiltSequencesExecutionsEntity)
    private readonly ciltSequencesExecutionsRepository: Repository<CiltSequencesExecutionsEntity>
  ) {}

  findAll = async () => {
    try {
      return await this.ciltSecuencesScheduleRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltSecuencesScheduleRepository.find({
        where: { siteId },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltId = async (ciltId: number) => {
    try {
      return await this.ciltSecuencesScheduleRepository.find({
        where: { ciltId },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const schedule = await this.ciltSecuencesScheduleRepository.findOneBy({
        id,
      });
      if (!schedule) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_SECUENCES_SCHEDULE,
        );
      }
      return schedule;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySequenceId = async (sequenceId: number) => {
    try {
      const schedules = await this.ciltSecuencesScheduleRepository.find({
        where: { secuenceId: sequenceId },
      });

      // Obtener las ejecuciones para cada schedule
      const schedulesWithExecutions = await Promise.all(
        schedules.map(async (schedule) => {
          const executions = await this.ciltSequencesExecutionsRepository.find({
            where: { 
              ciltSecuenceId: sequenceId,
              status: 'A',
              deletedAt: IsNull()
            }
          });
          return {
            ...schedule,
            executions
          };
        })
      );

      return schedulesWithExecutions;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  /**
   * Validate that the dynamically built day column is safe to use in SQL
   * This prevents SQL injection by ensuring only valid day column names are used
   */
  validateDayColumn = (dayColumn: string): boolean => {
    const validDayColumns = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return validDayColumns.includes(dayColumn);
  };

  /**
   * Find all scheduled sequences that should be executed on a specific date.
   * This method applies different scheduling rules based on scheduleType:
   * - dai: Daily schedules (every day)
   * - wee: Weekly schedules (checks if the current day of week is enabled)
   * - mon: Monthly schedules by day of month or week of month + day of week
   * - yea: Yearly schedules by specific date or month + day/week combinations
   * - man: Manual schedules (not included in automatic scheduling)
   *
   * @param dateStr - ISO date string in format 'YYYY-MM-DD'
   * @returns Promise with all matching active schedules
   */
  findSchedulesForDate = async (
    dateStr: string,
  ): Promise<CiltSecuencesScheduleEntity[]> => {
    try {
      // Parse the ISO date
      const date = new Date(dateStr + 'T00:00:00'); // Ensure consistent date parsing

      // Verify it's a valid date
      if (isNaN(date.getTime())) {
        throw new ValidationException(ValidationExceptionType.INVALID_DATE);
      }

      // Get date components
      const dayOfMonth = date.getDate();
      const month = date.getMonth() + 1; // Month is 0-based in JS, so add 1

      // Determine day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const dayOfWeekNum = date.getDay();
      const dayColumns = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const dayColumn = dayColumns[dayOfWeekNum];

      // Validate day column for security
      if (!this.validateDayColumn(dayColumn)) {
        throw new ValidationException(ValidationExceptionType.INVALID_DAY_COLUMN);
      }

      // Calculate week of month (1-based)
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const firstWeekDay = firstDayOfMonth.getDay();
      const offsetDate = date.getDate() + firstWeekDay - 1;
      const weekOfMonth = Math.floor(offsetDate / 7) + 1;

      // Create query to get all active schedules
      const queryBuilder = this.ciltSecuencesScheduleRepository
        .createQueryBuilder('schedule')
        .where('schedule.status = :status', { status: 'A' })
        // Only include schedules that haven't expired
        .andWhere(
          '(schedule.endDate IS NULL OR DATE(schedule.endDate) >= :currentDate)',
          { currentDate: dateStr },
        );

      // Add conditions for each schedule type
      queryBuilder.andWhere(
        new Brackets((qb) => {
          // dai: Daily schedule - executes every day
          qb.orWhere(`schedule.scheduleType = :dailyType`, {
            dailyType: 'dai',
          });

          // wee: Weekly schedule - check if the current day of week is enabled
          qb.orWhere(
            `(schedule.scheduleType = :weeklyType AND schedule.${dayColumn} = 1)`,
            { weeklyType: 'wee' },
          );

          // mon: Monthly schedules - two sub-types:
          // 1. By specific day of month (e.g., every 15th of the month)
          qb.orWhere(
            `(
            schedule.scheduleType = :monthlyType AND 
            schedule.dayOfMonth = :dayOfMonth AND
            (schedule.weekOfMonth IS NULL OR schedule.weekOfMonth = 0)
          )`,
            { monthlyType: 'mon', dayOfMonth },
          );

          // 2. By week of month and day of week (e.g., every 2nd Monday of each month)
          qb.orWhere(
            `(
            schedule.scheduleType = :monthlyType2 AND 
            schedule.weekOfMonth = :weekOfMonth AND 
            schedule.${dayColumn} = 1 AND
            (schedule.dayOfMonth IS NULL OR schedule.dayOfMonth = 0)
          )`,
            { monthlyType2: 'mon', weekOfMonth },
          );

          // yea: Yearly schedules - multiple sub-types:
          // 1. Specific date each year using dateOfYear field
          qb.orWhere(
            `(
            schedule.scheduleType = :yearlyType1 AND 
            schedule.dateOfYear IS NOT NULL AND
            MONTH(schedule.dateOfYear) = :month AND 
            DAY(schedule.dateOfYear) = :dayOfMonth
          )`,
            { yearlyType1: 'yea', month, dayOfMonth },
          );

          // 2. Specific month and day using separate fields
          qb.orWhere(
            `(
            schedule.scheduleType = :yearlyType2 AND 
            schedule.monthOfYear = :month AND 
            schedule.dayOfMonth = :dayOfMonth AND
            (schedule.weekOfMonth IS NULL OR schedule.weekOfMonth = 0) AND
            schedule.dateOfYear IS NULL
          )`,
            { yearlyType2: 'yea', month, dayOfMonth },
          );

          // 3. Specific week of specific month with day of week
          qb.orWhere(
            `(
            schedule.scheduleType = :yearlyType3 AND 
            schedule.monthOfYear = :month AND 
            schedule.weekOfMonth = :weekOfMonth AND 
            schedule.${dayColumn} = 1 AND
            (schedule.dayOfMonth IS NULL OR schedule.dayOfMonth = 0) AND
            schedule.dateOfYear IS NULL
          )`,
            { yearlyType3: 'yea', month, weekOfMonth },
          );
        }),
      );

      // Order by schedule time for better organization
      queryBuilder.orderBy('schedule.schedule', 'ASC');

      // Execute query and return results
      const results = await queryBuilder.getMany();

      // Additional validation - double check results using isScheduleActiveForDate
      const validatedResults = results.filter((schedule) =>
        this.isScheduleActiveForDate(schedule, dateStr),
      );

      return validatedResults;
    } catch (exception) {
      HandleException.exception(exception);
      return [];
    }
  };

  findSchedulesForDateSimplified = async (dateStr: string) => {
    try {
      const schedules = await this.findSchedulesForDate(dateStr);
      return schedules.map(schedule => ({
        id: schedule.id,
        siteId: schedule.siteId,
        ciltId: schedule.ciltId,
        secuenceId: schedule.secuenceId
      }));
    } catch (exception) {
      HandleException.exception(exception);
      return [];
    }
  };

  /**
   * Helper method to check if a specific schedule should execute on a given date
   * This is useful for validating individual schedules or for unit testing
   *
   * @param schedule - The schedule entity to evaluate
   * @param dateStr - ISO date string in format 'YYYY-MM-DD'
   * @returns boolean indicating if the schedule should execute
   */
  isScheduleActiveForDate = (
    schedule: CiltSecuencesScheduleEntity,
    dateStr: string,
  ): boolean => {
    try {
      const date = new Date(dateStr + 'T00:00:00'); // Ensure consistent date parsing

      // Verify it's a valid date
      if (isNaN(date.getTime())) {
        return false;
      }

      // Check if schedule is active
      if (schedule.status !== 'A') {
        return false;
      }

      // Check if schedule hasn't expired
      if (schedule.endDate) {
        const endDate = new Date(schedule.endDate + 'T23:59:59');
        if (date > endDate) {
          return false;
        }
      }

      // Get date components
      const dayOfMonth = date.getDate();
      const month = date.getMonth() + 1;
      const dayOfWeekNum = date.getDay();

      // Calculate week of month
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const firstWeekDay = firstDayOfMonth.getDay();
      const offsetDate = date.getDate() + firstWeekDay - 1;
      const weekOfMonth = Math.floor(offsetDate / 7) + 1;

      // Get day of week activation status
      const dayActivations = [
        schedule.sun,
        schedule.mon,
        schedule.tue,
        schedule.wed,
        schedule.thu,
        schedule.fri,
        schedule.sat,
      ];
      const isDayActive = dayActivations[dayOfWeekNum] === 1;

      // Evaluate based on schedule type
      switch (schedule.scheduleType?.toLowerCase()) {
        case 'dai': // Daily
          return true;

        case 'wee': // Weekly
          return isDayActive;

        case 'mon': // Monthly
          // Check if dayOfMonth or weekOfMonth is actually set (not null/0)
          const hasDayOfMonth = schedule.dayOfMonth && schedule.dayOfMonth > 0;
          const hasWeekOfMonth =
            schedule.weekOfMonth && schedule.weekOfMonth > 0;

          if (hasDayOfMonth && !hasWeekOfMonth) {
            // Monthly by day of month
            return dayOfMonth === schedule.dayOfMonth;
          } else if (hasWeekOfMonth && !hasDayOfMonth) {
            // Monthly by week of month + day of week
            return weekOfMonth === schedule.weekOfMonth && isDayActive;
          }
          return false;

        case 'yea': // Yearly
          if (schedule.dateOfYear) {
            // Yearly by specific date
            const yearlyDate = new Date(schedule.dateOfYear + 'T00:00:00');
            return (
              date.getMonth() === yearlyDate.getMonth() &&
              date.getDate() === yearlyDate.getDate()
            );
          } else {
            const hasMonthOfYear =
              schedule.monthOfYear && schedule.monthOfYear > 0;
            const hasDayOfMonth =
              schedule.dayOfMonth && schedule.dayOfMonth > 0;
            const hasWeekOfMonth =
              schedule.weekOfMonth && schedule.weekOfMonth > 0;

            if (hasMonthOfYear && hasDayOfMonth && !hasWeekOfMonth) {
              // Yearly by month and day
              return (
                month === schedule.monthOfYear &&
                dayOfMonth === schedule.dayOfMonth
              );
            } else if (hasMonthOfYear && hasWeekOfMonth && !hasDayOfMonth) {
              // Yearly by month, week, and day of week
              return (
                month === schedule.monthOfYear &&
                weekOfMonth === schedule.weekOfMonth &&
                isDayActive
              );
            }
          }
          return false;

        case 'man': // Manual
          return false; // Manual schedules don't execute automatically

        default:
          return false;
      }
    } catch (error) {
      console.error('Error in isScheduleActiveForDate:', error);
      return false;
    }
  };

  create = async (createDto: CreateCiltSecuencesScheduleDto) => {
    try {
      // Validar que existan las entidades relacionadas
      if (createDto.siteId) {
        const site = await this.siteRepository.findOneBy({ id: createDto.siteId });
        if (!site) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
        }
      }

      if (createDto.ciltId) {
        const cilt = await this.ciltMstrRepository.findOneBy({ id: createDto.ciltId });
        if (!cilt) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
        }
      }

      if (createDto.secuenceId) {
        const sequence = await this.ciltSequencesRepository.findOneBy({ id: createDto.secuenceId });
        if (!sequence) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SEQUENCES);
        }
      }

      // Found existing schedules for the same sequence
      const existingSchedules = await this.ciltSecuencesScheduleRepository.find({
        where: { secuenceId: createDto.secuenceId },
        order: { order: 'DESC' },
        take: 1
      });

      // Assign the next order number
      const nextOrder = existingSchedules.length > 0 ? existingSchedules[0].order + 1 : 1;
      createDto.order = nextOrder;

      const schedule = this.ciltSecuencesScheduleRepository.create(createDto);
      schedule.createdAt = new Date();
      return await this.ciltSecuencesScheduleRepository.save(schedule);
    } catch (exception) {
      if (exception instanceof ValidationException || exception instanceof NotFoundCustomException) {
        throw exception;
      }
      HandleException.exception(exception);
    }
  };

  update = async (updateDto: UpdateCiltSecuencesScheduleDto) => {
    try {
      const schedule = await this.ciltSecuencesScheduleRepository.findOneBy({
        id: updateDto.id,
      });
      if (!schedule) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_SECUENCES_SCHEDULE,
        );
      }

      // Validar que existan las entidades relacionadas
      if (updateDto.siteId) {
        const site = await this.siteRepository.findOneBy({ id: updateDto.siteId });
        if (!site) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
        }
      }

      if (updateDto.ciltId) {
        const cilt = await this.ciltMstrRepository.findOneBy({ id: updateDto.ciltId });
        if (!cilt) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
        }
      }

      if (updateDto.secuenceId) {
        const sequence = await this.ciltSequencesRepository.findOneBy({ id: updateDto.secuenceId });
        if (!sequence) {
          throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SEQUENCES);
        }
      }

      Object.assign(schedule, updateDto);
      schedule.updatedAt = new Date();
      return await this.ciltSecuencesScheduleRepository.save(schedule);
    } catch (exception) {
      if (exception instanceof ValidationException || exception instanceof NotFoundCustomException) {
        throw exception;
      }
      HandleException.exception(exception);
    }
  };

  findActiveSchedules = async () => {
    try {
      return await this.ciltSecuencesScheduleRepository.find({
        where: { status: stringConstants.activeStatus },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  delete = async (id: number) => {
    try {
      const schedule = await this.findById(id);
      schedule.status = stringConstants.inactiveStatus;
      schedule.deletedAt = new Date();
      return await this.ciltSecuencesScheduleRepository.save(schedule);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  updateOrder = async (updateOrderDto: UpdateScheduleOrderDTO) => {
    try {
      // Find the schedule to update
      const scheduleToUpdate = await this.ciltSecuencesScheduleRepository.findOneBy({
        id: updateOrderDto.scheduleId,
      });
      if (!scheduleToUpdate) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_SECUENCES_SCHEDULE,
        );
      }

      // Find the schedule that currently has the new order
      const scheduleWithNewOrder = await this.ciltSecuencesScheduleRepository.findOne({
        where: {
          secuenceId: scheduleToUpdate.secuenceId,
          order: updateOrderDto.newOrder,
        },
      });

      if (scheduleWithNewOrder) {
        // Swap orders
        const oldOrder = scheduleToUpdate.order;
        scheduleToUpdate.order = updateOrderDto.newOrder;
        scheduleWithNewOrder.order = oldOrder;

        // Save both schedules
        await this.ciltSecuencesScheduleRepository.save(scheduleWithNewOrder);
        return await this.ciltSecuencesScheduleRepository.save(scheduleToUpdate);
      } else {
        // If no schedule has the new order, just update the order
        scheduleToUpdate.order = updateOrderDto.newOrder;
        return await this.ciltSecuencesScheduleRepository.save(scheduleToUpdate);
      }
    } catch (exception) {
      if (exception instanceof ValidationException || exception instanceof NotFoundCustomException) {
        throw exception;
      }
      HandleException.exception(exception);
    }
  };
}
