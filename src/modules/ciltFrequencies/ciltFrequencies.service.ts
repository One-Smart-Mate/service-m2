import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltFrequenciesEntity } from './entities/ciltFrequencies.entity';
import { CreateCiltFrequenciesDTO } from './models/dto/createCiltFrequencies.dto';
import { UpdateCiltFrequenciesDTO } from './models/dto/updateCiltFrequencies.dto';
import { ResponseCiltFrequencyDTO } from './models/dto/responseCiltFrequencies.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class CiltFrequenciesService {
  constructor(
    @InjectRepository(CiltFrequenciesEntity)
    private readonly ciltFrequenciesRepository: Repository<CiltFrequenciesEntity>,
  ) {}

  findAll = async () => {
    try {
      const frequencies = await this.ciltFrequenciesRepository.find();
      return frequencies.map(frequency => this.mapToResponseDTO(frequency));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const frequency = await this.ciltFrequenciesRepository.findOneBy({ id });
      if (!frequency) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_FREQUENCIES);
      }
      return this.mapToResponseDTO(frequency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createDTO: CreateCiltFrequenciesDTO) => {
    try {
      const frequency = this.ciltFrequenciesRepository.create(createDTO);
      const savedFrequency = await this.ciltFrequenciesRepository.save(frequency);
      return this.mapToResponseDTO(savedFrequency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (id: number, updateDTO: UpdateCiltFrequenciesDTO) => {
    try {
      const frequency = await this.findById(id);
      Object.assign(frequency, updateDTO);
      const updatedFrequency = await this.ciltFrequenciesRepository.save(frequency);
      return this.mapToResponseDTO(updatedFrequency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  delete = async (id: number) => {
    try {
      await this.ciltFrequenciesRepository.delete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private mapToResponseDTO(frequency: CiltFrequenciesEntity): ResponseCiltFrequencyDTO {
    const responseDTO = new ResponseCiltFrequencyDTO();
    responseDTO.id = frequency.id;
    responseDTO.siteId = frequency.siteId;
    responseDTO.frecuencyCode = frequency.frecuencyCode;
    responseDTO.description = frequency.description;
    responseDTO.status = frequency.status;
    return responseDTO;
  }
} 