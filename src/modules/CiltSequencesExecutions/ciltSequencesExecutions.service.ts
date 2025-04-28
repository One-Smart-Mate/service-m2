import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequencesExecutionsEntity } from './entities/ciltSequencesExecutions.entity';
import { CreateCiltSequencesExecutionDTO } from './models/dto/create.ciltSequencesExecution.dto';
import { UpdateCiltSequencesExecutionDTO } from './models/dto/update.ciltSequencesExecution.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class CiltSequencesExecutionsService {
  constructor(
    @InjectRepository(CiltSequencesExecutionsEntity)
    private readonly ciltSequencesExecutionsRepository: Repository<CiltSequencesExecutionsEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltSequencesExecutionsRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltSequencesExecutionsRepository.find({ where: { siteId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByPositionId = async (positionId: number) => {
    try {
      return await this.ciltSequencesExecutionsRepository.find({ where: { positionId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltId = async (ciltId: number) => {
    try {
      return await this.ciltSequencesExecutionsRepository.find({ where: { ciltId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltDetailsId = async (ciltDetailsId: number) => {
    try {
      return await this.ciltSequencesExecutionsRepository.find({ where: { ciltDetailsId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const execution = await this.ciltSequencesExecutionsRepository.findOneBy({ id });
      if (!execution) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SEQUENCES_EXECUTIONS);
      }
      return execution;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createDTO: CreateCiltSequencesExecutionDTO) => {
    try {
      const execution = this.ciltSequencesExecutionsRepository.create(createDTO);
      return await this.ciltSequencesExecutionsRepository.save(execution);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateDTO: UpdateCiltSequencesExecutionDTO) => {
    try {
      const execution = await this.findById(updateDTO.id);
      Object.assign(execution, updateDTO);
      return await this.ciltSequencesExecutionsRepository.save(execution);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
} 