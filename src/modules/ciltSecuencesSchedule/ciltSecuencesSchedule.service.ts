import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CiltSecuencesScheduleEntity } from './entities/ciltSecuencesSchedule.entity';
import { CreateCiltSecuencesScheduleDto } from './models/dto/create.ciltSecuencesSchedule.dto';
import { UpdateCiltSecuencesScheduleDto } from './models/dto/update.ciltSecuencesSchedule.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';
import { stringConstants } from 'src/utils/string.constant';

@Injectable()
export class CiltSecuencesScheduleService {
  constructor(
    @InjectRepository(CiltSecuencesScheduleEntity)
    private readonly ciltSecuencesScheduleRepository: Repository<CiltSecuencesScheduleEntity>,
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
      return await this.ciltSecuencesScheduleRepository.find({ where: { siteId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltId = async (ciltId: number) => {
    try {
      return await this.ciltSecuencesScheduleRepository.find({ where: { ciltId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const schedule = await this.ciltSecuencesScheduleRepository.findOneBy({ id });
      if (!schedule) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SECUENCES_SCHEDULE);
      }
      return schedule;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  /**
 * Find all scheduled sequences that should be executed on a specific date.
 * This method applies different scheduling rules based on schedule_type:
 * - D1: Daily schedules (checks if the current day of week is enabled)
 * - M1: Monthly schedules by day of month
 * - M2: Monthly schedules by week of month and day of week
 * - Y1: Yearly schedules by specific date
 * - Y2: Yearly schedules by month, week and day of week
 * 
 * @param dateStr - ISO date string in format 'YYYY-MM-DD'
 * @returns Promise with all matching active schedules
 */
findSchedulesForDate = async (dateStr: string) => {
  try {
    // Parse the ISO date
    const date = new Date(dateStr);
    
    // Verify it's a valid date
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    // Get date components
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1; // Month is 0-based in JS, so add 1
    
    // Determine day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeekNum = date.getDay();
    const dayColumns = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayColumn = dayColumns[dayOfWeekNum];
    
    // Calculate week of month with precision
    // First, get the first day of the month
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeekFirstDay = firstDayOfMonth.getDay();
    
    // Calculate offset for the first week
    // This makes week calculation more accurate based on calendar weeks
    const offsetDay = dayOfWeekFirstDay === 0 ? 6 : dayOfWeekFirstDay - 1;
    
    // Calculate which week of the month the date falls in
    const weekOfMonth = Math.ceil((date.getDate() + offsetDay) / 7);
    
    // Create query to get all active schedules
    const queryBuilder = this.ciltSecuencesScheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.status = :status', { status: 'A' })
      // Only include schedules that haven't expired
      .andWhere('(schedule.end_date IS NULL OR schedule.end_date >= :currentDate)', 
        { currentDate: dateStr });
    
    // Add conditions for each schedule type
    queryBuilder.andWhere(new Brackets(qb => {
      // D1: Daily schedule - check if the current day of week is enabled
      // For example, if today is Tuesday, check if the 'tue' field is 1
      qb.orWhere(`(schedule.schedule_type = 'D1' AND schedule.${dayColumn} = 1)`);
      
      // M1: Monthly schedule by day of month
      // For example, if today is the 20th, check if day_of_month = 20
      qb.orWhere(`(schedule.schedule_type = 'M1' AND schedule.day_of_month = :dayOfMonth)`, 
        { dayOfMonth });
      
      // M2: Monthly schedule by week of month and day of week
      // For example, "every Tuesday of the 3rd week of each month"
      qb.orWhere(`(schedule.schedule_type = 'M2' AND schedule.week_of_month = :weekOfMonth AND schedule.${dayColumn} = 1)`, 
        { weekOfMonth });
      
      // Y1: Yearly schedule by specific date
      // For example, "every May 20th" - can be stored in two ways:
      // 1. As a complete date in date_of_year (only month and day are relevant)
      // 2. As separate fields month_of_year and day_of_month
      qb.orWhere(`(
        schedule.schedule_type = 'Y1' AND 
        (
          (MONTH(schedule.date_of_year) = :month AND DAY(schedule.date_of_year) = :dayOfMonth) OR
          (schedule.month_of_year = :month AND schedule.day_of_month = :dayOfMonth)
        )
      )`, { month, dayOfMonth });
      
      // Y2: Yearly schedule by month, week and day of week
      // For example, "every Tuesday of the 3rd week of May each year"
      qb.orWhere(`(
        schedule.schedule_type = 'Y2' AND 
        schedule.month_of_year = :month AND 
        schedule.week_of_month = :weekOfMonth AND 
        schedule.${dayColumn} = 1
      )`, { month, weekOfMonth });
    }));
    
    // Execute query and return results
    const results = await queryBuilder.getMany();
    
    return results;
  } catch (exception) {
    HandleException.exception(exception);
  }
};

  create = async (createDto: CreateCiltSecuencesScheduleDto) => {
    try {
      const schedule = this.ciltSecuencesScheduleRepository.create(createDto);
      schedule.createdAt = new Date();
      return await this.ciltSecuencesScheduleRepository.save(schedule);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateDto: UpdateCiltSecuencesScheduleDto) => {
    try {
      const schedule = await this.ciltSecuencesScheduleRepository.findOneBy({ id: updateDto.id });
      if (!schedule) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SECUENCES_SCHEDULE);
      }

      Object.assign(schedule, updateDto);
      schedule.updatedAt = new Date();
      return await this.ciltSecuencesScheduleRepository.save(schedule);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findActiveSchedules = async () => {
    try {
      return await this.ciltSecuencesScheduleRepository.find({ where: { status: stringConstants.activeStatus } });
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
} 