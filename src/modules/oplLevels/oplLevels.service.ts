import { withLockedOpl } from '../oplMstr/opl-transaction';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { OplLevelsEntity } from './entities/oplLevels.entity';
import { CreateOplLevelsDTO } from './models/create-opl-levels.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { OplMstr } from 'src/modules/oplMstr/entities/oplMstr.entity';
import { OplDetailsEntity } from 'src/modules/oplDetails/entities/oplDetails.entity';
import { LevelEntity } from 'src/modules/level/entities/level.entity';

@Injectable()
export class OplLevelsService {
  constructor(
    @InjectRepository(OplLevelsEntity)
    private readonly oplLevelsRepository: Repository<OplLevelsEntity>,
    @InjectRepository(OplMstr)
    private readonly oplMstrRepository: Repository<OplMstr>,
    @InjectRepository(OplDetailsEntity)
    private readonly oplDetailsRepository: Repository<OplDetailsEntity>,
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
  ) {}

  async create(createOplLevelsDTO: CreateOplLevelsDTO) {
    try {
      return await withLockedOpl(this.oplLevelsRepository.manager.connection, createOplLevelsDTO.oplId, async (manager, opl) => {
        const level = await manager.findOne(LevelEntity, { where: { id: createOplLevelsDTO.levelId, deletedAt: IsNull(), status: 'A' } });
        if (!level) throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
        if (Number(opl.siteId) !== Number(level.siteId))
          throw new BadRequestException('The OPL and level must belong to the same site');
        const repository = manager.getRepository(OplLevelsEntity);
        const existing = await repository.findOne({ where: { oplId: opl.id, levelId: level.id, deletedAt: IsNull() } });
        if (existing) return existing;
        return repository.save(repository.create({ siteId: opl.siteId, oplId: opl.id, levelId: level.id }));
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async findOplMstrByLevelId(levelId: number): Promise<any[]> {
    try {
      const level = await this.levelRepository.findOne({
        where: { id: levelId, deletedAt: IsNull() },
      });
      if (!level) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      }

      const oplLevels = await this.oplLevelsRepository.find({
        where: { levelId, deletedAt: IsNull() },
      });

      if (!oplLevels || oplLevels.length === 0) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.OPLLEVELS,
        );
      }

      const relationOplIds = [
        ...new Set(
          oplLevels
            .filter(
              (oplLevel) =>
                oplLevel.siteId == null ||
                Number(oplLevel.siteId) === Number(level.siteId),
            )
            .map((oplLevel) => oplLevel.oplId),
        ),
      ];

      if (relationOplIds.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }

      const opls = await this.oplMstrRepository.find({
        where: {
          id: In(relationOplIds),
          siteId: level.siteId,
          deletedAt: IsNull(),
        },
      });

      const oplIds = opls.map((opl) => opl.id);
      if (oplIds.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }

      const details = await this.oplDetailsRepository.find({
        where: [
          { oplId: In(oplIds), siteId: level.siteId, deletedAt: IsNull() },
          { oplId: In(oplIds), siteId: IsNull(), deletedAt: IsNull() },
        ],
        order: { order: 'ASC' },
      });

      // Update direct usage counters for OPLs accessed from menu
      if (oplIds.length > 0) {
        await this.updateOplDirectUsageCounters(oplIds);
      }

      const oplLevelMap = new Map();
      oplLevels.forEach((oplLevel) => {
        if (oplIds.includes(oplLevel.oplId)) {
          oplLevelMap.set(oplLevel.oplId, oplLevel.id);
        }
      });

      return opls.map((opl) => ({
        ...opl,
        oplLevelId: oplLevelMap.get(opl.id),
        details: details.filter((detail) => detail.oplId === opl.id),
        levels: [
          {
            oplLevelId: oplLevelMap.get(opl.id),
            id: level.id,
            name: level.name,
            description: level.description,
            levelMachineId: level.levelMachineId,
            level: level.level,
            superiorId: level.superiorId,
          },
        ],
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async findLevelsByOplId(oplId: number): Promise<any[]> {
    try {
      const opl = await this.oplMstrRepository.findOne({
        where: { id: oplId, deletedAt: IsNull() },
      });
      if (!opl) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }

      const oplLevels = await this.oplLevelsRepository.find({
        where: { oplId, deletedAt: IsNull() },
      });

      if (!oplLevels || oplLevels.length === 0) {
        return [];
      }

      const levelIds = [...new Set(oplLevels.map((ol) => ol.levelId))];
      const levels = await this.levelRepository.find({
        where: { id: In(levelIds), deletedAt: IsNull() },
      });
      const levelMap = new Map(levels.map((lvl) => [Number(lvl.id), lvl]));

      return oplLevels.map((ol) => {
        const level = levelMap.get(Number(ol.levelId));
        return {
          id: ol.id,
          oplId: ol.oplId,
          levelId: ol.levelId,
          siteId: ol.siteId,
          level: level
            ? {
                id: level.id,
                name: level.name,
                superiorId: level.superiorId,
              }
            : null,
        };
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  async remove(id: number) {
    try {
      const oplLevels = await this.oplLevelsRepository.findOne({
        where: { id },
      });
      if (!oplLevels) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.OPLLEVELS,
        );
      }

      await withLockedOpl(this.oplLevelsRepository.manager.connection, oplLevels.oplId, async (manager) => {
        await manager.getRepository(OplLevelsEntity).softDelete({ id: oplLevels.id, oplId: oplLevels.oplId });
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }

  /**
   * Updates the direct usage counters for OPLs accessed from menu
   * @param oplIds Array of OPL IDs to update
   */
  private async updateOplDirectUsageCounters(oplIds: number[]): Promise<void> {
    try {
      const currentTime = new Date();

      // Update direct usage counter for all accessed OPLs
      await this.oplMstrRepository
        .createQueryBuilder()
        .update(OplMstr)
        .set({
          directUsageCount: () => 'COALESCE(direct_usage_count, 0) + 1',
          lastUsedAt: currentTime,
        })
        .whereInIds(oplIds)
        .execute();
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
}
