import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequencesExecutionsEvidencesEntity } from './entities/ciltSequencesExecutionsEvidences.entity';
import { CreateCiltSequencesEvidenceDTO } from './models/dtos/createCiltSequencesEvidence.dto';
import { UpdateCiltSequencesEvidenceDTO } from './models/dtos/updateCiltSequencesEvidence.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class CiltSequencesExecutionsEvidencesService {
  constructor(
    @InjectRepository(CiltSequencesExecutionsEvidencesEntity)
    private readonly ciltSequencesExecutionsEvidencesRepository: Repository<CiltSequencesExecutionsEvidencesEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltSequencesExecutionsEvidencesRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltSequencesExecutionsEvidencesRepository.find({ where: { siteId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByPositionId = async (positionId: number) => {
    try {
      return await this.ciltSequencesExecutionsEvidencesRepository.find({ where: { positionId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCiltId = async (ciltId: number) => {
    try {
      return await this.ciltSequencesExecutionsEvidencesRepository.find({ where: { ciltId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const ciltEvidence = await this.ciltSequencesExecutionsEvidencesRepository.findOne({
        where: { id },
      });
      if (!ciltEvidence) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_SEQUENCES_EXECUTIONS_EVIDENCES,
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
      const ciltEvidence = this.ciltSequencesExecutionsEvidencesRepository.create(
        createCiltSequencesEvidenceDTO,
      );
      return await this.ciltSequencesExecutionsEvidencesRepository.save(ciltEvidence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (
    updateCiltSequencesEvidenceDTO: UpdateCiltSequencesEvidenceDTO,
  ) => {
    try {
      const ciltEvidence = await this.findById(updateCiltSequencesEvidenceDTO.id);
      if (!ciltEvidence) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_SEQUENCES_EXECUTIONS_EVIDENCES,
        );
      }
      Object.assign(ciltEvidence, updateCiltSequencesEvidenceDTO);
      return await this.ciltSequencesExecutionsEvidencesRepository.save(ciltEvidence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  delete = async (id: number) => {
    try {
      const ciltEvidence = await this.findById(id);
      if (!ciltEvidence) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_SEQUENCES_EXECUTIONS_EVIDENCES,
        );
      }
      return await this.ciltSequencesExecutionsEvidencesRepository.softDelete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
