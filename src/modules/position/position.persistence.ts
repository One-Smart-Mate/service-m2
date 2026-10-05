import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull } from 'typeorm';
import { LevelEntity } from '../level/entities/level.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { UserHasSitesEntity } from '../users/entities/user.has.sites.entity';
import { UsersPositionsEntity } from '../users/entities/users.positions.entity';
import { PositionEntity } from './entities/position.entity';
import { CreatePositionDto } from './models/dto/create.position.dto';
import { UpdatePositionDto } from './models/dto/update.position.dto';
import { UpdatePositionOrderDTO } from './models/dto/update-order.dto';
import { UserEntity } from '../users/entities/user.entity';
import {
  validateOrder,
  withSiteResourceTransaction,
  withSiteTransaction,
} from '../../common/database/site-transaction';

@Injectable()
export class PositionPersistence {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  create(input: CreatePositionDto): Promise<PositionEntity> {
    const siteId = this.requiredId(input.siteId, 'siteId');
    return withSiteTransaction(this.dataSource, siteId, async (manager) => {
      const derived = await this.validateRelations(manager, input, siteId);
      const repository = manager.getRepository(PositionEntity);
      const last = await repository.findOne({
        where: { siteId, deletedAt: IsNull() },
        order: { order: 'DESC' },
      });
      const { userIds, ...fields } = input;
      const position = repository.create({
        ...fields,
        ...derived,
        order: validateOrder(Number(last?.order ?? 0) + 1),
        createdAt: new Date(),
      });
      const saved = await repository.save(position);
      await this.replaceUsers(manager, saved, this.normalizeUserIds(userIds));
      return saved;
    });
  }

  update(input: UpdatePositionDto): Promise<PositionEntity> {
    return withSiteResourceTransaction(
      this.dataSource,
      PositionEntity,
      input.id,
      async (manager, position) => {
        const repository = manager.getRepository(PositionEntity);
        const siteId = this.requiredId(position.siteId, 'siteId');
        if (input.siteId !== undefined && Number(input.siteId) !== siteId) {
          throw new BadRequestException('Position site cannot be reassigned');
        }

        const replaceUsers =
          input.userIds !== undefined && input.userIds !== null;
        const userIds = replaceUsers
          ? this.normalizeUserIds(input.userIds)
          : this.normalizeUserIds(
              (
                await manager.find(UsersPositionsEntity, {
                  where: { positionId: position.id, deletedAt: IsNull() },
                })
              ).map(({ userId }) => userId),
            );
        const derived = await this.validateRelations(
          manager,
          { ...position, ...input, userIds },
          siteId,
        );
        const fields = { ...input };
        delete fields.userIds;
        delete fields.id;
        Object.assign(position, fields, derived, { updatedAt: new Date() });
        const saved = await repository.save(position);
        if (replaceUsers) await this.replaceUsers(manager, saved, userIds);
        return saved;
      },
    );
  }

  updateOrder(input: UpdatePositionOrderDTO): Promise<PositionEntity> {
    const newOrder = validateOrder(input.newOrder);
    return withSiteResourceTransaction(
      this.dataSource,
      PositionEntity,
      input.positionId,
      async (manager, position) => {
        if (position.status !== 'A')
          throw new ConflictException('Only active positions can be reordered');
        if (Number(position.order) === newOrder) return position;
        const target = await manager.findOne(PositionEntity, {
          where: {
            siteId: Number(position.siteId),
            status: 'A',
            deletedAt: IsNull(),
            order: newOrder,
          },
          lock: { mode: 'pessimistic_write' },
        });
        const updatedAt = new Date();
        if (target)
          await manager.update(
            PositionEntity,
            { id: target.id, deletedAt: IsNull() },
            { order: position.order, updatedAt },
          );
        await manager.update(
          PositionEntity,
          { id: position.id, deletedAt: IsNull() },
          { order: newOrder, updatedAt },
        );
        return Object.assign(position, { order: newOrder, updatedAt });
      },
    );
  }

  private async validateRelations(
    manager: EntityManager,
    input: Pick<PositionEntity, 'levelId' | 'nodeResponsableId'> & {
      userIds?: number[] | null;
    },
    siteId: number,
  ) {
    const site = await manager.findOne(SiteEntity, {
      where: { id: siteId, status: 'A', deletedAt: IsNull() },
      lock: { mode: 'pessimistic_write' },
    });
    if (!site)
      throw new BadRequestException('Active position site is required');

    const levelId = this.requiredId(input.levelId, 'levelId');
    const levels: LevelEntity[] = [];
    const visited = new Set<number>();
    let currentId = levelId;
    while (currentId) {
      if (visited.has(currentId)) {
        throw new BadRequestException(
          'Position level hierarchy contains a cycle',
        );
      }
      visited.add(currentId);
      const level = await manager.findOne(LevelEntity, {
        where: { id: currentId, siteId, status: 'A', deletedAt: IsNull() },
        lock: { mode: 'pessimistic_read' },
      });
      if (!level) {
        throw new BadRequestException(
          'Position levels must belong to its active site',
        );
      }
      levels.push(level);
      currentId =
        level.superiorId != null && Number(level.superiorId) !== 0
          ? this.requiredId(level.superiorId, 'superiorId')
          : 0;
    }

    const responsibleId =
      input.nodeResponsableId == null || Number(input.nodeResponsableId) === 0
        ? null
        : this.requiredId(input.nodeResponsableId, 'nodeResponsableId');
    const userIds = this.normalizeUserIds(input.userIds);
    const memberIds = [
      ...new Set([...userIds, ...(responsibleId ? [responsibleId] : [])]),
    ].sort((a, b) => a - b);
    let responsibleName: string = null;
    for (const id of memberIds) {
      const membership = await manager.findOne(UserHasSitesEntity, {
        where: {
          user: { id },
          site: { id: siteId },
          status: 'A',
          deletedAt: IsNull(),
        },
        lock: { mode: 'pessimistic_read' },
      });
      // Do not lock a joined user after the site: credential writers acquire
      // users before sites. READ COMMITTED observes the account independently.
      const user = await manager.findOne(UserEntity, {
        where: { id, status: 'A', deletedAt: IsNull() },
      });
      if (!membership || !user) {
        throw new BadRequestException(
          'Position users must be active members of its site',
        );
      }
      if (id === responsibleId) responsibleName = user.name;
    }
    const root = levels[levels.length - 1];
    return {
      siteId,
      siteName: site.name,
      siteType: site.siteType,
      levelId,
      levelName: levels[0].name,
      areaId: Number(root.id),
      areaName: root.name,
      route: levels
        .map(({ name }) => name)
        .reverse()
        .join('/'),
      nodeResponsableId: responsibleId,
      nodeResponsableName: responsibleName,
    };
  }

  private async replaceUsers(
    manager: EntityManager,
    position: PositionEntity,
    userIds: number[],
  ): Promise<void> {
    await manager.delete(UsersPositionsEntity, { positionId: position.id });
    if (userIds.length === 0) return;
    const assignments = userIds.map((userId) =>
      manager.create(UsersPositionsEntity, {
        siteId: position.siteId,
        userId,
        positionId: position.id,
      }),
    );
    await manager.save(UsersPositionsEntity, assignments);
  }

  private normalizeUserIds(value?: number[] | null): number[] {
    if (value == null) return [];
    if (!Array.isArray(value))
      throw new BadRequestException('userIds must be an array');
    return [...new Set(value.map((id) => this.requiredId(id, 'userIds')))];
  }

  private requiredId(value: unknown, field: string): number {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
    return id;
  }
}
