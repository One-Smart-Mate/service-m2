import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequencesExecutionsEntity } from './entities/ciltSequencesExecutions.entity';
import { CreateCiltSequencesExecutionDTO } from './models/dto/create.ciltSequencesExecution.dto';
import { UpdateCiltSequencesExecutionDTO } from './models/dto/update.ciltSequencesExecution.dto';
import { ResponseCiltSequencesExecutionDTO } from './models/dto/responseCiltSequencesExecution.dto';
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
      const executions = await this.ciltSequencesExecutionsRepository.find();
      return executions.map(execution => this.mapToResponseDTO(execution));
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
      return this.mapToResponseDTO(execution);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createDTO: CreateCiltSequencesExecutionDTO) => {
    try {
      const execution = this.ciltSequencesExecutionsRepository.create(createDTO);
      const savedExecution = await this.ciltSequencesExecutionsRepository.save(execution);
      return this.mapToResponseDTO(savedExecution);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (id: number, updateDTO: UpdateCiltSequencesExecutionDTO) => {
    try {
      const execution = await this.findById(id);
      Object.assign(execution, updateDTO);
      const updatedExecution = await this.ciltSequencesExecutionsRepository.save(execution);
      return this.mapToResponseDTO(updatedExecution);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private mapToResponseDTO(execution: CiltSequencesExecutionsEntity): ResponseCiltSequencesExecutionDTO {
    const responseDTO = new ResponseCiltSequencesExecutionDTO();
    responseDTO.id = execution.id;
    responseDTO.siteId = execution.siteId;
    responseDTO.positionId = execution.positionId;
    responseDTO.ciltId = execution.ciltId;
    responseDTO.ciltDetailsId = execution.ciltDetailsId;
    responseDTO.secuenceStart = execution.secuenceStart;
    responseDTO.secuenceStop = execution.secuenceStop;
    responseDTO.duration = execution.duration;
    responseDTO.standardOk = execution.standardOk;
    responseDTO.initialParameter = execution.initialParameter;
    responseDTO.evidenceAtCreation = execution.evidenceAtCreation;
    responseDTO.finalParameter = execution.finalParameter;
    responseDTO.evidenceAtFinal = execution.evidenceAtFinal;
    responseDTO.stoppageReason = execution.stoppageReason;
    responseDTO.amTag = execution.amTag;
    responseDTO.createdAt = execution.createdAt;
    responseDTO.updatedAt = execution.updatedAt;
    return responseDTO;
  }
} 