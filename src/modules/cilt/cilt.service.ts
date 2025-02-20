import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltEntity } from './entities/cilt.entity';
import { CreateCiltDto } from './models/dto/create.cilt.dto';
import { UpdateCiltDto } from './models/dto/update.cilt.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class CiltService {
  constructor(
    @InjectRepository(CiltEntity)
    private readonly ciltRepository: Repository<CiltEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const cilt = await this.ciltRepository.findOneBy({ id });
      if (!cilt) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT);
      }
      return cilt;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createCiltDto: CreateCiltDto) => {
    try {
      const cilt = this.ciltRepository.create(createCiltDto);
      return await this.ciltRepository.save(cilt);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateCiltDto: UpdateCiltDto) => {
    try {
      const cilt = await this.ciltRepository.findOneBy({
        id: updateCiltDto.id,
      });
      if (!cilt) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT);
      }

      Object.assign(cilt, updateCiltDto);
      return await this.ciltRepository.save(cilt);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
