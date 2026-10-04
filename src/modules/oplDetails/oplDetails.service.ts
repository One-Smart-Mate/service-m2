import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OplDetailsEntity } from './entities/oplDetails.entity';
import { CreateOplDetailsDTO } from './models/dto/createOplDetails.dto';
import { UpdateOplDetailsDTO } from './models/dto/updateOplDetails.dto';
import { UpdateOplDetailOrderDTO } from './models/dto/update-order.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { OplDetailPersistence } from './opl-detail.persistence';

@Injectable()
export class OplDetailsService {
  constructor(
    @InjectRepository(OplDetailsEntity)
    private readonly oplDetailsRepository: Repository<OplDetailsEntity>,
    private readonly oplDetailPersistence: OplDetailPersistence,
  ) {}

  findAll = async () => {
    try {
      return await this.oplDetailsRepository.find({
        order: { order: 'ASC' }
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const detail = await this.oplDetailsRepository.findOneBy({ id });
      if (!detail) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_DETAILS);
      }
      return detail;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByOplId = async (oplId: number) => {
    try {
      const details = await this.oplDetailsRepository.find({ 
        where: { oplId },
        order: { order: 'ASC' }
      });
      if (!details || details.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_DETAILS);
      }
      return details;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createOplDetailsDto: CreateOplDetailsDTO) => {
    try {
      return await this.oplDetailPersistence.create(createOplDetailsDto);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateOplDetailsDto: UpdateOplDetailsDTO) => {
    try {
      return await this.oplDetailPersistence.update(updateOplDetailsDto);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  updateOrder = async (updateOrderDto: UpdateOplDetailOrderDTO) => {
    try {
      return await this.oplDetailPersistence.updateOrder(updateOrderDto);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  delete = async (id: number) => {
    try {
      const detail = await this.oplDetailsRepository.findOneBy({ id });
      if (!detail) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_DETAILS);
      }
      return await this.oplDetailsRepository.softDelete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
