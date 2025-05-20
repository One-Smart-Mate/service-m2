import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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