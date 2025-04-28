import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequencesEntity } from './entities/ciltSequences.entity';
import { CreateCiltSequenceDTO } from './models/dto/createCiltSequence.dto';
import { UpdateCiltSequenceDTO } from './models/dto/updateCiltSequence.dto';
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
      return await this.ciltSequencesRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltSequencesRepository.find({ where: { siteId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByPositionId = async (positionId: number) => {
    try {
      return await this.ciltSequencesRepository.find({ where: { positionId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByAreaId = async (areaId: number) => {
    try {
      return await this.ciltSequencesRepository.find({ where: { areaId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltMstrId = async (ciltMstrId: number) => {
    try {
      return await this.ciltSequencesRepository.find({ where: { ciltMstrId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByLevelId = async (levelId: number) => {
    try {
      return await this.ciltSequencesRepository.find({ where: { levelId } });
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
      return sequence;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createDTO: CreateCiltSequenceDTO) => {
    try {
      const sequence = this.ciltSequencesRepository.create(createDTO);
      return await this.ciltSequencesRepository.save(sequence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateDTO: UpdateCiltSequenceDTO) => {
    try {
      const sequence = await this.findById(updateDTO.id);
      Object.assign(sequence, updateDTO);
      return await this.ciltSequencesRepository.save(sequence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
} 