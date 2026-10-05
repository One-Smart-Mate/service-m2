import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull } from 'typeorm';
import { SiteEntity } from '../site/entities/site.entity';
import { CardEntity } from '../card/entities/card.entity';
import { LevelEntity } from './entities/level.entity';
import { MoveLevelDto } from './models/dto/move.level.dto';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import {
  collectLevelDescendants,
  levelMapFrom,
  normalizeLevelId,
  traceLevelHierarchy,
} from './level-hierarchy.policy';

@Injectable()
export class LevelHierarchyPersistence {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  inSite<T>(
    siteId: number,
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction('READ COMMITTED', async (manager) => {
      const site = await manager.findOne(SiteEntity, {
        where: {
          id: normalizeLevelId(siteId),
          status: 'A',
          deletedAt: IsNull(),
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (!site) throw new BadRequestException('Level site must be active');
      return work(manager);
    });
  }

  async withLevel<T>(
    id: number,
    work: (manager: EntityManager, level: LevelEntity) => Promise<T>,
  ): Promise<T> {
    const snapshot = await this.dataSource
      .getRepository(LevelEntity)
      .findOneBy({ id: normalizeLevelId(id) });
    if (!snapshot)
      throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
    return this.inSite(Number(snapshot.siteId), async (manager) => {
      const level = await manager.findOne(LevelEntity, {
        where: { id: normalizeLevelId(id), siteId: Number(snapshot.siteId) },
        lock: { mode: 'pessimistic_write' },
      });
      if (!level)
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      return work(manager, level);
    });
  }

  move(input: MoveLevelDto) {
    const parentId = normalizeLevelId(input.newSuperiorId, true);
    const id = normalizeLevelId(input.levelId);
    if (id === parentId)
      throw new BadRequestException('A level cannot be its own parent');
    return this.withLevel(id, async (manager, level) => {
      if (level.deletedAt)
        throw new NotFoundCustomException(NotFoundCustomExceptionType.LEVELS);
      const siteId = Number(level.siteId);
      const levels = levelMapFrom(
        await manager.find(LevelEntity, { where: { siteId } }),
      );
      traceLevelHierarchy(id, levels);
      const affectedIds = collectLevelDescendants(id, levels);
      if (parentId) {
        const parent = levels.get(parentId);
        if (!parent || parent.deletedAt || parent.status !== 'A') {
          throw new BadRequestException(
            'Parent must be an active level in the same site',
          );
        }
        if (affectedIds.includes(parentId)) {
          throw new BadRequestException(
            'A level cannot be moved below one of its descendants',
          );
        }
        traceLevelHierarchy(parentId, levels);
      }
      const oldParentId = normalizeLevelId(level.superiorId ?? 0, true);
      if (oldParentId === parentId) {
        return {
          siteId,
          response: {
            message: 'The level is already in the requested position',
            level,
          },
        };
      }

      const children = [...levels.values()].filter(
        (child) => Number(child.superiorId) === id,
      );
      // The existing move contract leaves children with the previous parent.
      for (const child of children) child.superiorId = oldParentId;
      levels.get(id).superiorId = parentId;
      const changedAt = new Date();
      for (const affectedId of affectedIds) {
        const affected = levels.get(affectedId);
        const path = traceLevelHierarchy(affectedId, levels);
        const root = path[path.length - 1];
        affected.level = path.length - 1;
        await manager.update(
          LevelEntity,
          { id: affectedId, siteId },
          {
            superiorId: normalizeLevelId(affected.superiorId ?? 0, true),
            level: affected.level,
            updatedAt: changedAt,
          },
        );
        await manager.update(
          CardEntity,
          { nodeId: affectedId, siteId },
          {
            cardLocation: [...path]
              .reverse()
              .map(({ name }) => name)
              .join('/'),
            areaId: root.id,
            areaName: root.name,
            nodeName: affected.name,
            level: affected.level,
            superiorId: Number(affected.superiorId) || affectedId,
            updatedAt: changedAt,
          },
        );
      }
      const movedLevel = await manager.findOneBy(LevelEntity, { id, siteId });
      return {
        siteId,
        response: {
          level: movedLevel,
          childrenUpdated: children.length,
          cardsUpdated: affectedIds.length,
        },
      };
    });
  }
}
