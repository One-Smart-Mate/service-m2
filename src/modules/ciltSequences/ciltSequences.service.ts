import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequencesEntity } from './entities/ciltSequences.entity';
import { CreateCiltSequenceDTO } from './models/dto/createCiltSequence.dto';
import { UpdateCiltSequenceDTO } from './models/dto/updateCiltSequence.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { SiteEntity } from '../site/entities/site.entity';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { CiltFrequenciesEntity } from '../ciltFrequencies/entities/ciltFrequencies.entity';
import { CiltTypesEntity } from '../ciltTypes/entities/ciltTypes.entity';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';

@Injectable()
export class CiltSequencesService {
  constructor(
    @InjectRepository(CiltSequencesEntity)
    private readonly ciltSequencesRepository: Repository<CiltSequencesEntity>,
    @InjectRepository(SiteEntity)
    private readonly siteRepository: Repository<SiteEntity>,
    @InjectRepository(CiltMstrEntity)
    private readonly ciltMstrRepository: Repository<CiltMstrEntity>,
    @InjectRepository(CiltFrequenciesEntity)
    private readonly ciltFrequenciesRepository: Repository<CiltFrequenciesEntity>,
    @InjectRepository(CiltTypesEntity)
    private readonly ciltTypeRepository: Repository<CiltTypesEntity>,
    @InjectRepository(OplMstr)
    private readonly oplMstrRepository: Repository<OplMstr>,
  ) {}

  private async validateRelatedEntities(
    dto: CreateCiltSequenceDTO | UpdateCiltSequenceDTO,
  ) {
    if (dto.siteId) {
      const site = await this.siteRepository.findOneBy({ id: dto.siteId });
      if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      }
    }

    if (dto.ciltMstrId) {
      const ciltMstr = await this.ciltMstrRepository.findOneBy({
        id: dto.ciltMstrId,
      });
      if (!ciltMstr) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_MSTR,
        );
      }
    }

    if (dto.frecuencyId) {
      const frequency = await this.ciltFrequenciesRepository.findOneBy({
        id: dto.frecuencyId,
      });
      if (!frequency) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_FREQUENCIES,
        );
      }
    }

    if (dto.ciltTypeId) {
      const ciltType = await this.ciltTypeRepository.findOneBy({
        id: dto.ciltTypeId,
      });
      if (!ciltType) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_TYPES,
        );
      }
    }
    if (dto.referenceOplSopId) {
      const referenceOplSop = await this.oplMstrRepository.findOneBy({
        id: dto.referenceOplSopId,
      });
      if (!referenceOplSop) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.OPL_MSTR,
        );
      }
    }
    if (dto.remediationOplSopId) {
      const remediationOplSop = await this.oplMstrRepository.findOneBy({
        id: dto.remediationOplSopId,
      });
      if (!remediationOplSop) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.OPL_MSTR,
        );
      }
    }
  }

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

  findByCiltMstrId = async (ciltMstrId: number) => {
    try {
      return await this.ciltSequencesRepository.find({ where: { ciltMstrId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const sequence = await this.ciltSequencesRepository.findOneBy({ id });
      if (!sequence) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.CILT_SEQUENCES,
        );
      }
      return sequence;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (dto: CreateCiltSequenceDTO) => {
    try {
      await this.validateRelatedEntities(dto);

      if (!dto.order || dto.order <= 0) {
        const { max } = await this.ciltSequencesRepository
          .createQueryBuilder('seq')
          .select('MAX(seq.`order`)', 'max')
          .where('seq.site_id = :siteId', { siteId: dto.siteId })
          .getRawOne<{ max: number }>();

        dto.order = (max ?? 0) + 1;
      }

      const sequence = this.ciltSequencesRepository.create(dto);
      return await this.ciltSequencesRepository.save(sequence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateDTO: UpdateCiltSequenceDTO) => {
    try {
      const sequence = await this.findById(updateDTO.id);
      await this.validateRelatedEntities(updateDTO);
      Object.assign(sequence, updateDTO);
      return await this.ciltSequencesRepository.save(sequence);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
