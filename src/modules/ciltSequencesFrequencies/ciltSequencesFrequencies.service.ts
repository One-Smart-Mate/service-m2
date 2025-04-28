import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequencesFrequencies } from './entities/ciltSequencesFrequencies.entity';
import { CreateCiltSequencesFrequenciesDTO } from './models/dto/createCiltSequencesFrequencies.dto';
import { UpdateCiltSequencesFrequenciesDTO } from './models/dto/updateCiltSequencesFrequencies.dto';
import { ResponseCiltSequencesFrequenciesDTO } from './models/dto/responseCiltSequencesFrequencies.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class CiltSequencesFrequenciesService {
  constructor(
    @InjectRepository(CiltSequencesFrequencies)
    private readonly ciltSequencesFrequenciesRepository: Repository<CiltSequencesFrequencies>,
  ) {}

  findAll = async () => {
    try {
      const frecuencies = await this.ciltSequencesFrequenciesRepository.find();
      return frecuencies.map(frecuency => this.mapToResponseDTO(frecuency));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const frecuency = await this.ciltSequencesFrequenciesRepository.findOneBy({ id });
      if (!frecuency) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SEQUENCES_FREQUENCIES);
      }
      return this.mapToResponseDTO(frecuency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createCiltSequencesFrequenciesDto: CreateCiltSequencesFrequenciesDTO) => {
    try {
      const frecuency = this.ciltSequencesFrequenciesRepository.create(createCiltSequencesFrequenciesDto);
      const savedFrecuency = await this.ciltSequencesFrequenciesRepository.save(frecuency);
      return this.mapToResponseDTO(savedFrecuency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateCiltSequencesFrequenciesDto: UpdateCiltSequencesFrequenciesDTO) => {
    try {
      const frecuency = await this.findById(updateCiltSequencesFrequenciesDto.id);
      Object.assign(frecuency, updateCiltSequencesFrequenciesDto);
      const updatedFrecuency = await this.ciltSequencesFrequenciesRepository.save(frecuency);
      return this.mapToResponseDTO(updatedFrecuency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private mapToResponseDTO(frecuency: CiltSequencesFrequencies): ResponseCiltSequencesFrequenciesDTO {
    const responseDTO = new ResponseCiltSequencesFrequenciesDTO();
    responseDTO.id = frecuency.id;
    responseDTO.ciltSecuenceId = frecuency.ciltSecuenceId;
    responseDTO.frecuencyId = frecuency.frecuencyId;
    responseDTO.status = frecuency.status;
    responseDTO.createdAt = frecuency.createdAt;
    responseDTO.updatedAt = frecuency.updatedAt;
    return responseDTO;
  }
} 