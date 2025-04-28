import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequencesExecutionsEntity } from './entities/ciltSequencesExecutions.entity';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { CreateCiltSequencesExecutionDTO } from './models/dto/create.ciltSequencesExecution.dto';
import { UpdateCiltSequencesExecutionDTO } from './models/dto/update.ciltSequencesExecution.dto';
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

  findByCiltId = async (ciltId: number) => {
    try {
      return await this.ciltSequencesExecutionsRepository.find({
        where: { ciltId },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySequenceId = async (sequenceId: number) => {
    try {
      return await this.ciltSequencesExecutionsRepository.find({
        where: { sequenceId },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByUserId = async (userId: number) => {
    try {
      return await this.ciltSequencesExecutionsRepository.find({
        where: { userId },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createCiltSequencesExecutionDTO: CreateCiltSequencesExecutionDTO) => {
    try {
      const execution = this.ciltSequencesExecutionsRepository.create({
        ...createCiltSequencesExecutionDTO,
        createdAt: new Date(),
      });
      return await this.ciltSequencesExecutionsRepository.save(execution);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateCiltSequencesExecutionDTO: UpdateCiltSequencesExecutionDTO) => {
    try {
      const execution = await this.ciltSequencesExecutionsRepository.findOneBy({ id: updateCiltSequencesExecutionDTO.id });
      if (!execution) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SEQUENCES_EXECUTIONS);
      }

      Object.assign(execution, updateCiltSequencesExecutionDTO);
      execution.updatedAt = new Date();

      return await this.ciltSequencesExecutionsRepository.save(execution);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
} 