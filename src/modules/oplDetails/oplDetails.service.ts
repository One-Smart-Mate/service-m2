import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OplDetailsEntity } from './entities/oplDetails.entity';
import { CreateOplDetailsDTO } from './models/dto/createOplDetails.dto';
import { UpdateOplDetailsDTO } from './models/dto/updateOplDetails.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class OplDetailsService {
  constructor(
    @InjectRepository(OplDetailsEntity)
    private readonly oplDetailsRepository: Repository<OplDetailsEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.oplDetailsRepository.find();
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
      const details = await this.oplDetailsRepository.findBy({ oplId });
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
      const detail = this.oplDetailsRepository.create(createOplDetailsDto);
      return await this.oplDetailsRepository.save(detail);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateOplDetailsDto: UpdateOplDetailsDTO) => {
    try {
      const detail = await this.oplDetailsRepository.findOneBy({
        id: updateOplDetailsDto.id,
      });
      if (!detail) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_DETAILS);
      }

      Object.assign(detail, updateOplDetailsDto);
      return await this.oplDetailsRepository.save(detail);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
} 