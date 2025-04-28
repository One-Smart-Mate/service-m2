import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequencesEntity } from './entities/ciltSequences.entity';
import { CreateCiltSequenceDTO } from './models/dto/createCiltSequence.dto';
import { UpdateCiltSequenceDTO } from './models/dto/updateCiltSequence.dto';
import { ResponseCiltSequenceDTO } from './models/dto/responseCiltSequence.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class CiltSequencesService {
  constructor(
    @InjectRepository(CiltSequencesEntity)
    private readonly ciltSequencesRepository: Repository<CiltSequencesEntity>,
  ) {}

  findAll = async () => {
    try {
      const sequences = await this.ciltSequencesRepository.find();
      return sequences.map(sequence => this.mapToResponseDTO(sequence));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const sequence = await this.ciltSequencesRepository.findOneBy({ id });
      if (!sequence) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_SEQUENCES);
      }
      return this.mapToResponseDTO(sequence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createDTO: CreateCiltSequenceDTO) => {
    try {
      const sequence = this.ciltSequencesRepository.create(createDTO);
      const savedSequence = await this.ciltSequencesRepository.save(sequence);
      return this.mapToResponseDTO(savedSequence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (id: number, updateDTO: UpdateCiltSequenceDTO) => {
    try {
      const sequence = await this.findById(id);
      Object.assign(sequence, updateDTO);
      const updatedSequence = await this.ciltSequencesRepository.save(sequence);
      return this.mapToResponseDTO(updatedSequence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };


  private mapToResponseDTO(sequence: CiltSequencesEntity): ResponseCiltSequenceDTO {
    const responseDTO = new ResponseCiltSequenceDTO();
    responseDTO.id = sequence.id;
    responseDTO.siteId = sequence.siteId;
    responseDTO.siteName = sequence.siteName;
    responseDTO.areaId = sequence.areaId;
    responseDTO.areaName = sequence.areaName;
    responseDTO.positionId = sequence.positionId;
    responseDTO.positionName = sequence.positionName;
    responseDTO.ciltMstrId = sequence.ciltMstrId;
    responseDTO.ciltMstrName = sequence.ciltMstrName;
    responseDTO.levelId = sequence.levelId;
    responseDTO.levelName = sequence.levelName;
    responseDTO.order = sequence.order;
    responseDTO.secuenceList = sequence.secuenceList;
    responseDTO.secuenceColor = sequence.secuenceColor;
    responseDTO.ciltTypeId = sequence.ciltTypeId;
    responseDTO.ciltTypeName = sequence.ciltTypeName;
    responseDTO.referenceOplSop = sequence.referenceOplSop;
    responseDTO.standardTime = sequence.standardTime;
    responseDTO.standardOk = sequence.standardOk;
    responseDTO.remediationOplSop = sequence.remediationOplSop;
    responseDTO.toolsRequired = sequence.toolsRequired;
    responseDTO.stoppageReason = sequence.stoppageReason;
    responseDTO.quantityPicturesCreate = sequence.quantityPicturesCreate;
    responseDTO.quantityPicturesClose = sequence.quantityPicturesClose;
    responseDTO.createdAt = sequence.createdAt;
    responseDTO.updatedAt = sequence.updatedAt;
    return responseDTO;
  }
} 