import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OplTypes } from './entities/oplTypes.entity';
import { CreateOplTypeDto } from './models/dto/createOplType.dto';
import { UpdateOplTypeDto } from './models/dto/updateOplType.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class OplTypesService {
  constructor(
    @InjectRepository(OplTypes)
    private readonly oplTypesRepository: Repository<OplTypes>,
  ) {}

  findAll = async () => {
    try {
      return await this.oplTypesRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySite = async (siteId: number) => {
    try {
      return await this.oplTypesRepository.find({
        where: { siteId },
        order: { createdAt: 'DESC' }
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const oplType = await this.oplTypesRepository.findOneBy({ id });
      if (!oplType) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_TYPE);
      }
      return oplType;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createOplDto: CreateOplTypeDto) => {
    try {
      const oplType = this.oplTypesRepository.create(createOplDto);
      return await this.oplTypesRepository.save(oplType);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateOplDto: UpdateOplTypeDto) => {
    try {
      const oplType = await this.oplTypesRepository.findOneBy({
        id: updateOplDto.id,
      });
      if (!oplType) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_TYPE);
      }

      Object.assign(oplType, updateOplDto);
      return await this.oplTypesRepository.save(oplType);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  softDelete = async (id: number) => {
    try {
      const oplType = await this.oplTypesRepository.findOneBy({ id });
      if (!oplType) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_TYPE);
      }
      
      return await this.oplTypesRepository.softDelete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}