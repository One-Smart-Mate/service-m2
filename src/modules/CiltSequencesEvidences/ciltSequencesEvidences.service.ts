import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequencesEvidencesEntity } from './entities/ciltSequencesEvidences.entity';
import { CreateCiltSequencesEvidenceDTO } from './models/dtos/createCiltSequencesEvidence.dto';
import { UpdateCiltSequencesEvidenceDTO } from './models/dtos/updateCiltSequencesEvidence.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class CiltSequencesEvidencesService {
  constructor(
    @InjectRepository(CiltSequencesEvidencesEntity)
    private readonly ciltSequencesEvidencesRepository: Repository<CiltSequencesEvidencesEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltSequencesEvidencesRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltSequencesEvidencesRepository.find({ where: { siteId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByPositionId = async (positionId: number) => {
    try {
      return await this.ciltSequencesEvidencesRepository.find({ where: { positionId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltId = async (ciltId: number) => {
    try {
      return await this.ciltSequencesEvidencesRepository.find({ where: { ciltId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const ciltEvidence = await this.ciltSequencesEvidencesRepository.findOne({
        where: { id },
      });
      if (!ciltEvidence) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_SEQUENCES_EVIDENCES,
        );
      }
      return ciltEvidence;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (
    createCiltSequencesEvidenceDTO: CreateCiltSequencesEvidenceDTO,
  ) => {
    try {
      const ciltEvidence = this.ciltSequencesEvidencesRepository.create(
        createCiltSequencesEvidenceDTO,
      );
      return await this.ciltSequencesEvidencesRepository.save(ciltEvidence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (
    updateCiltSequencesEvidenceDTO: UpdateCiltSequencesEvidenceDTO,
  ) => {
    try {
      const ciltEvidence = await this.findById(updateCiltSequencesEvidenceDTO.id);
      Object.assign(ciltEvidence, updateCiltSequencesEvidenceDTO);
      return await this.ciltSequencesEvidencesRepository.save(ciltEvidence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
