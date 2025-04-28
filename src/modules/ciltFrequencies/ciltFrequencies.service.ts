import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltFrequencies } from './entities/ciltFrequencies.entity';
import { CreateCiltFrequencyDTO } from './models/dto/createCiltFrequency.dto';
import { UpdateCiltFrequencyDTO } from './models/dto/updateCiltFrequency.dto';
import { ResponseCiltFrequencyDTO } from './models/dto/responseCiltFrequency.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class CiltFrequenciesService {
  constructor(
    @InjectRepository(CiltFrequencies)
    private readonly ciltFrequenciesRepository: Repository<CiltFrequencies>,
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

  create = async (createCiltFrequencyDto: CreateCiltFrequencyDTO) => {
    try {
      const frequency = this.ciltFrequenciesRepository.create(createCiltFrequencyDto);
      const savedFrequency = await this.ciltFrequenciesRepository.save(frequency);
      return this.mapToResponseDTO(savedFrequency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateCiltFrequencyDto: UpdateCiltFrequencyDTO) => {
    try {
      const frequency = await this.findById(updateCiltFrequencyDto.id);
      Object.assign(frequency, updateCiltFrequencyDto);
      const updatedFrequency = await this.ciltFrequenciesRepository.save(frequency);
      return this.mapToResponseDTO(updatedFrequency);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private mapToResponseDTO(frequency: CiltFrequencies): ResponseCiltFrequencyDTO {
    const responseDTO = new ResponseCiltFrequencyDTO();
    responseDTO.id = frequency.id;
    responseDTO.name = frequency.name;
    responseDTO.description = frequency.description;
    responseDTO.days = frequency.days;
    responseDTO.status = frequency.status;
    responseDTO.createdAt = frequency.createdAt;
    responseDTO.updatedAt = frequency.updatedAt;
    return responseDTO;
  }
} 