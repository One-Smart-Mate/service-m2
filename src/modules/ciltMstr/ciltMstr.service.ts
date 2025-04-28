import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltMstrEntity } from './entities/ciltMstr.entity';
import { CreateCiltMstrDTO } from './models/dto/create.ciltMstr.dto';
import { UpdateCiltMstrDTO } from './models/dto/update.ciltMstr.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class CiltMstrService {
  constructor(
    @InjectRepository(CiltMstrEntity)
    private readonly ciltRepository: Repository<CiltMstrEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltRepository.find({ where: { siteId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByPositionId = async (positionId: number) => {
    try {
      return await this.ciltRepository.find({ where: { positionId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const cilt = await this.ciltRepository.findOneBy({ id });
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
}
