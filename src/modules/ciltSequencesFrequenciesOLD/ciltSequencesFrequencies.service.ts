import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequencesFrequenciesEntity } from './entities/ciltSequencesFrequencies.entity';
import { CreateCiltSequencesFrequenciesDTO } from './models/dto/createCiltSequencesFrequencies.dto';
import { UpdateCiltSequencesFrequenciesDTO } from './models/dto/updateCiltSequencesFrequencies.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class CiltSequencesFrequenciesService {
  constructor(
    @InjectRepository(CiltSequencesFrequenciesEntity)
    private readonly ciltSequencesFrequenciesRepository: Repository<CiltSequencesFrequenciesEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltSequencesFrequenciesRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltSequencesFrequenciesRepository.find({ where: { siteId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByPositionId = async (positionId: number) => {
    try {
      return await this.ciltSequencesFrequenciesRepository.find({ where: { positionId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltId = async (ciltId: number) => {
    try {
      return await this.ciltSequencesFrequenciesRepository.find({ where: { ciltId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByFrecuencyId = async (frecuencyId: number) => {
    try {
      return await this.ciltSequencesFrequenciesRepository.find({ where: { frecuencyId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const frequency = await this.ciltSequencesFrequenciesRepository.findOneBy({ id });
      if (!frequency) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SEQUENCES_FREQUENCIES);
      }
      return frequency;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createDTO: CreateCiltSequencesFrequenciesDTO) => {
    try {
      const frequency = this.ciltSequencesFrequenciesRepository.create(createDTO);
      return await this.ciltSequencesFrequenciesRepository.save(frequency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateDTO: UpdateCiltSequencesFrequenciesDTO) => {
    try {
      const frequency = await this.findById(updateDTO.id);
      Object.assign(frequency, updateDTO);
      return await this.ciltSequencesFrequenciesRepository.save(frequency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
} 