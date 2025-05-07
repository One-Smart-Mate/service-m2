import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltFrequenciesEntity } from './entities/ciltFrequencies.entity';
import { CreateCiltFrequenciesDTO } from './models/dto/createCiltFrequencies.dto';
import { UpdateCiltFrequenciesDTO } from './models/dto/updateCiltFrequencies.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class CiltFrequenciesService {
  constructor(
    @InjectRepository(CiltFrequenciesEntity)
    private readonly ciltFrequenciesRepository: Repository<CiltFrequenciesEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltFrequenciesRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const frequency = await this.ciltFrequenciesRepository.findOneBy({ id });
      if (!frequency) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_FREQUENCIES,
        );
      }
      return frequency;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createDTO: CreateCiltFrequenciesDTO) => {
    try {
      const frequency = this.ciltFrequenciesRepository.create(createDTO);
      return await this.ciltFrequenciesRepository.save(frequency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateDTO: UpdateCiltFrequenciesDTO) => {
    try {
      const frequency = await this.findById(updateDTO.id);
      Object.assign(frequency, updateDTO);
      return await this.ciltFrequenciesRepository.save(frequency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
