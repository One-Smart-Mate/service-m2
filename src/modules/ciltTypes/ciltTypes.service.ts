import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltTypesEntity } from './entities/ciltTypes.entity';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';
import { CreateCiltTypeDTO } from './models/dto/createCiltType.dto';
import { UpdateCiltTypeDTO } from './models/dto/updateCiltType.dto';
import { ResponseCiltTypeDTO } from './models/dto/responseCiltType.dto';


@Injectable()
export class CiltTypesService {
  constructor(
    @InjectRepository(CiltTypesEntity)
    private readonly ciltTypesRepository: Repository<CiltTypesEntity>,
  ) {}

  findAll = async () => {
    try {
      const ciltTypes = await this.ciltTypesRepository.find();
      return ciltTypes.map(ciltType => this.mapToResponseDTO(ciltType));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const ciltType = await this.ciltTypesRepository.findOneBy({ id });
      if (!ciltType) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_TYPES);
      }
      return this.mapToResponseDTO(ciltType);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createCiltTypeDto: CreateCiltTypeDTO) => {
    try {
      const ciltType = this.ciltTypesRepository.create(createCiltTypeDto);
      const savedCiltType = await this.ciltTypesRepository.save(ciltType);
      return this.mapToResponseDTO(savedCiltType);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateCiltTypeDto: UpdateCiltTypeDTO) => {
    try {
      const ciltType = await this.findById(updateCiltTypeDto.id);
      Object.assign(ciltType, updateCiltTypeDto);
      const updatedCiltType = await this.ciltTypesRepository.save(ciltType);
      return this.mapToResponseDTO(updatedCiltType);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private mapToResponseDTO(ciltType: CiltTypesEntity): ResponseCiltTypeDTO {
    const responseDTO = new ResponseCiltTypeDTO();
    responseDTO.id = ciltType.id;
    responseDTO.name = ciltType.name;
    responseDTO.status = ciltType.status;
    return responseDTO;
  }
} 