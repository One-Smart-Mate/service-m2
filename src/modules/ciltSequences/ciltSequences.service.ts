import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSequencesEntity } from './entities/ciltSequences.entity';
import { CreateCiltSequenceDTO } from './models/dto/createCiltSequence.dto';
import { UpdateCiltSequenceDTO } from './models/dto/updateCiltSequence.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';
import { SiteEntity } from '../site/entities/site.entity';
import { LevelEntity } from '../level/entities/level.entity';
import { PositionEntity } from '../position/entities/position.entity';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { CiltFrequenciesEntity } from '../ciltFrequencies/entities/ciltFrequencies.entity';

@Injectable()
export class CiltSequencesService {
  constructor(
    @InjectRepository(CiltSequencesEntity)
    private readonly ciltSequencesRepository: Repository<CiltSequencesEntity>,
    @InjectRepository(SiteEntity)
    private readonly siteRepository: Repository<SiteEntity>,
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
    @InjectRepository(PositionEntity)
    private readonly positionRepository: Repository<PositionEntity>,
    @InjectRepository(CiltMstrEntity)
    private readonly ciltMstrRepository: Repository<CiltMstrEntity>,
    @InjectRepository(CiltFrequenciesEntity)
    private readonly ciltFrequenciesRepository: Repository<CiltFrequenciesEntity>,
  ) {}

  private async validateRelatedEntities(dto: CreateCiltSequenceDTO | UpdateCiltSequenceDTO) {
    if (dto.siteId) {
      const site = await this.siteRepository.findOneBy({ id: dto.siteId });
      if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      }
    }

    if (dto.areaId) {
      const area = await this.levelRepository.findOneBy({ id: dto.areaId });
      if (!area) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      }
    }

    if (dto.positionId) {
      const position = await this.positionRepository.findOneBy({ id: dto.positionId });
      if (!position) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.POSITION);
      }
    }

    if (dto.ciltMstrId) {
      const ciltMstr = await this.ciltMstrRepository.findOneBy({ id: dto.ciltMstrId });
      if (!ciltMstr) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }
    }

    if (dto.frecuencyId) {
      const frequency = await this.ciltFrequenciesRepository.findOneBy({ id: dto.frecuencyId });
      if (!frequency) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_FREQUENCIES);
      }
    }

    if (dto.levelId) {
      const level = await this.levelRepository.findOneBy({ id: dto.levelId });
      if (!level) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
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
      await this.validateRelatedEntities(createDTO);
      const sequence = this.ciltSequencesRepository.create(createDTO);
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