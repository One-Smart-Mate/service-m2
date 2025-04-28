import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequencesFrequenciesEntity } from './entities/ciltSequencesFrequencies.entity';
import { CreateCiltSequencesFrequenciesDTO } from './models/dto/createCiltSequencesFrequencies.dto';
import { UpdateCiltSequencesFrequenciesDTO } from './models/dto/updateCiltSequencesFrequencies.dto';
import { ResponseCiltSequencesFrequenciesDTO } from './models/dto/responseCiltSequencesFrequencies.dto';
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
      const frequencies = await this.ciltSequencesFrequenciesRepository.find();
      return frequencies.map(frequency => this.mapToResponseDTO(frequency));
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
      return this.mapToResponseDTO(frequency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createDTO: CreateCiltSequencesFrequenciesDTO) => {
    try {
      const frequency = this.ciltSequencesFrequenciesRepository.create(createDTO);
      const savedFrequency = await this.ciltSequencesFrequenciesRepository.save(frequency);
      return this.mapToResponseDTO(savedFrequency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (id: number, updateDTO: UpdateCiltSequencesFrequenciesDTO) => {
    try {
      const frequency = await this.findById(id);
      Object.assign(frequency, updateDTO);
      const updatedFrequency = await this.ciltSequencesFrequenciesRepository.save(frequency);
      return this.mapToResponseDTO(updatedFrequency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  delete = async (id: number) => {
    try {
      const frequency = await this.findById(id);
      await this.ciltSequencesFrequenciesRepository.remove(frequency);
      return true;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private mapToResponseDTO(frequency: CiltSequencesFrequenciesEntity): ResponseCiltSequencesFrequenciesDTO {
    const responseDTO = new ResponseCiltSequencesFrequenciesDTO();
    responseDTO.id = frequency.id;
    responseDTO.siteId = frequency.siteId;
    responseDTO.positionId = frequency.positionId;
    responseDTO.ciltId = frequency.ciltId;
    responseDTO.secuencyId = frequency.secuencyId;
    responseDTO.frecuencyId = frequency.frecuencyId;
    responseDTO.frecuencyCode = frequency.frecuencyCode;
    responseDTO.status = frequency.status;
    return responseDTO;
  }
} 