import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OplDetails } from './entities/oplDetails.entity';
import { CreateOplDetailsDTO } from './models/dto/createOplDetails.dto';
import { UpdateOplDetailsDTO } from './models/dto/updateOplDetails.dto';
import { ResponseOplDetailsDTO } from './models/dto/responseOplDetails.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class OplDetailsService {
  constructor(
    @InjectRepository(OplDetails)
    private readonly oplDetailsRepository: Repository<OplDetails>,
  ) {}

  findAll = async () => {
    try {
      const details = await this.oplDetailsRepository.find();
      return details.map(detail => this.mapToResponseDTO(detail));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const detail = await this.oplDetailsRepository.findOneBy({ id });
      if (!detail) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_DETAILS);
      }
      return this.mapToResponseDTO(detail);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createOplDetailsDto: CreateOplDetailsDTO) => {
    try {
      const detail = this.oplDetailsRepository.create(createOplDetailsDto);
      const savedDetail = await this.oplDetailsRepository.save(detail);212118
      212118
      
      return this.mapToResponseDTO(savedDetail);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateOplDetailsDto: UpdateOplDetailsDTO) => {
    try {
      const detail = await this.oplDetailsRepository.findOneBy({
        id: updateOplDetailsDto.id,
      });
      if (!detail) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_DETAILS);
      }

      Object.assign(detail, updateOplDetailsDto);
      const updatedDetail = await this.oplDetailsRepository.save(detail);
      return this.mapToResponseDTO(updatedDetail);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private mapToResponseDTO(detail: OplDetails): ResponseOplDetailsDTO {
    const responseDTO = new ResponseOplDetailsDTO();
    responseDTO.id = detail.id;
    responseDTO.oplId = detail.oplId;
    responseDTO.name = detail.name;
    responseDTO.description = detail.description;
    responseDTO.status = detail.status;
    responseDTO.createdAt = detail.createdAt;
    responseDTO.updatedAt = detail.updatedAt;
    return responseDTO;
  }
} 