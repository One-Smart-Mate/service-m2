import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequences } from './entities/ciltSequences.entity';
import { CreateCiltSequenceDTO } from './models/dto/createCiltSequence.dto';
import { UpdateCiltSequenceDTO } from './models/dto/updateCiltSequence.dto';
import { ResponseCiltSequenceDTO } from './models/dto/responseCiltSequence.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class CiltSequencesService {
  constructor(
    @InjectRepository(CiltSequences)
    private readonly ciltSecuencesRepository: Repository<CiltSequences>,
  ) {}

  findAll = async () => {
    try {
      const secuences = await this.ciltSecuencesRepository.find();
      return secuences.map(secuence => this.mapToResponseDTO(secuence));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const secuence = await this.ciltSecuencesRepository.findOneBy({ id });
      if (!secuence) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SEQUENCES);
      }
      return this.mapToResponseDTO(secuence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createCiltSequenceDto: CreateCiltSequenceDTO) => {
    try {
      const secuence = this.ciltSecuencesRepository.create(createCiltSequenceDto);
      const savedSecuence = await this.ciltSecuencesRepository.save(secuence);
      return this.mapToResponseDTO(savedSecuence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateCiltSequenceDto: UpdateCiltSequenceDTO) => {
    try {
      const secuence = await this.findById(updateCiltSequenceDto.id);
      Object.assign(secuence, updateCiltSequenceDto);
      const updatedSecuence = await this.ciltSecuencesRepository.save(secuence);
      return this.mapToResponseDTO(updatedSecuence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private mapToResponseDTO(secuence: CiltSequences): ResponseCiltSequenceDTO {
    const responseDTO = new ResponseCiltSequenceDTO();
    responseDTO.id = secuence.id;
    responseDTO.ciltId = secuence.ciltId;
    responseDTO.sequenceNumber = secuence.sequenceNumber;
    responseDTO.description = secuence.description;
    responseDTO.status = secuence.status;
    responseDTO.createdAt = secuence.createdAt;
    responseDTO.updatedAt = secuence.updatedAt;
    return responseDTO;
  }
} 