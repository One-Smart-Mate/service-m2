import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltTypesEntity } from './entities/ciltTypes.entity';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';
import { CreateCiltTypeDTO } from './models/dto/createCiltType.dto';
import { UpdateCiltTypeDTO } from './models/dto/updateCiltType.dto';

@Injectable()
export class CiltTypesService {
  constructor(
    @InjectRepository(CiltTypesEntity)
    private readonly ciltTypesRepository: Repository<CiltTypesEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltTypesRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const ciltType = await this.ciltTypesRepository.findOneBy({ id });
      if (!ciltType) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_TYPES);
      }
      return ciltType;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createCiltTypeDto: CreateCiltTypeDTO) => {
    try {
      const ciltType = this.ciltTypesRepository.create(createCiltTypeDto);
      return await this.ciltTypesRepository.save(ciltType);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateCiltTypeDto: UpdateCiltTypeDTO) => {
    try {
      const ciltType = await this.findById(updateCiltTypeDto.id);
      Object.assign(ciltType, updateCiltTypeDto);
      return await this.ciltTypesRepository.save(ciltType);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
} 