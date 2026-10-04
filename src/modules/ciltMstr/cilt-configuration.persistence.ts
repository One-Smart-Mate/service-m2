import { InjectDataSource } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  EntityTarget,
  IsNull,
  ObjectLiteral,
} from 'typeorm';
import { SiteEntity } from '../site/entities/site.entity';
import { PositionEntity } from '../position/entities/position.entity';
import { LevelEntity } from '../level/entities/level.entity';
import { CiltMstrEntity } from './entities/ciltMstr.entity';
import { CiltSequencesEntity } from '../ciltSequences/entities/ciltSequences.entity';
import { CiltMstrPositionLevelsEntity } from '../ciltMstrPositionLevels/entities/ciltMstrPositionLevels.entity';
import { CiltSecuencesScheduleEntity } from '../ciltSecuencesSchedule/entities/ciltSecuencesSchedule.entity';
import { CreateCiltMstrPositionLevelsDto } from '../ciltMstrPositionLevels/model/create.ciltMstrPositionLevels.dto';
import { UpdateCiltMstrPositionLevelsDto } from '../ciltMstrPositionLevels/model/update.ciltMstrPositionLevels.dto';
import { CreateCiltSecuencesScheduleDto } from '../ciltSecuencesSchedule/models/dto/create.ciltSecuencesSchedule.dto';
import { UpdateCiltSecuencesScheduleDto } from '../ciltSecuencesSchedule/models/dto/update.ciltSecuencesSchedule.dto';

@Injectable()
export class CiltConfigurationPersistence {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  createAssignment(input: CreateCiltMstrPositionLevelsDto) {
    return this.dataSource.transaction(async (manager) => {
      await this.validateAssignment(manager, input);
      return manager.save(
        manager.create(CiltMstrPositionLevelsEntity, {
          ...input,
          createdAt: new Date(),
        }),
      );
    });
  }

  updateAssignment(input: UpdateCiltMstrPositionLevelsDto) {
    return this.dataSource.transaction(async (manager) => {
      const current = await this.lockCurrent(
        manager,
        CiltMstrPositionLevelsEntity,
        input.id,
      );
      this.assertSameSite(current.siteId, input.siteId);
      const merged = Object.assign(current, this.defined(input));
      await this.validateAssignment(manager, merged);
      merged.updatedAt = new Date();
      return manager.save(merged);
    });
  }

  createSchedules(input: CreateCiltSecuencesScheduleDto) {
    return this.dataSource.transaction(async (manager) => {
      await this.validateSchedule(manager, input);
      if (!Array.isArray(input.schedules) || !input.schedules.length) {
        throw new BadRequestException('At least one schedule time is required');
      }
      input.schedules.forEach((time) => this.validateTime(time));
      const previous = await manager.findOne(CiltSecuencesScheduleEntity, {
        where: { secuenceId: input.secuenceId, deletedAt: IsNull() },
        order: { order: 'DESC' },
      });
      const nextOrder = (previous?.order ?? 0) + 1;
      const { schedules, ...fields } = input;
      const entities = schedules.map((schedule, index) =>
        manager.create(CiltSecuencesScheduleEntity, {
          ...fields,
          schedule,
          order: nextOrder + index,
          createdAt: new Date(),
        }),
      );
      return manager.save(entities);
    });
  }

  updateSchedule(input: UpdateCiltSecuencesScheduleDto) {
    return this.dataSource.transaction(async (manager) => {
      const current = await this.lockCurrent(
        manager,
        CiltSecuencesScheduleEntity,
        input.id,
      );
      this.assertSameSite(current.siteId, input.siteId);
      const merged = Object.assign(current, this.defined(input));
      await this.validateSchedule(manager, merged);
      this.validateTime(merged.schedule);
      merged.updatedAt = new Date();
      return manager.save(merged);
    });
  }

  private async validateAssignment(
    manager: EntityManager,
    input: CreateCiltMstrPositionLevelsDto,
  ) {
    await this.lockSite(manager, input.siteId);
    for (const [entity, id, label] of [
      [CiltMstrEntity, input.ciltMstrId, 'CILT master'],
      [PositionEntity, input.positionId, 'Position'],
      [LevelEntity, input.levelId, 'Level'],
    ] as const) {
      await this.requireInSite(manager, entity, id, input.siteId, label);
    }
  }

  private async validateSchedule(
    manager: EntityManager,
    input: { siteId?: number; ciltId?: number; secuenceId?: number },
  ) {
    await this.lockSite(manager, input.siteId);
    await this.requireInSite(
      manager,
      CiltMstrEntity,
      input.ciltId,
      input.siteId,
      'CILT master',
    );
    const sequence = await this.requireInSite(
      manager,
      CiltSequencesEntity,
      input.secuenceId,
      input.siteId,
      'Sequence',
    );
    if (Number(sequence.ciltMstrId) !== Number(input.ciltId)) {
      throw new BadRequestException(
        'Sequence must belong to the selected CILT master',
      );
    }
  }

  private async lockSite(manager: EntityManager, id: number) {
    this.requireId(id);
    const site = await manager.findOne(SiteEntity, {
      where: { id, deletedAt: IsNull(), status: 'A' },
      lock: { mode: 'pessimistic_write' },
    });
    if (!site) throw new BadRequestException('Site must be active');
  }

  private async requireInSite<T extends ObjectLiteral>(
    manager: EntityManager,
    entity: EntityTarget<T>,
    id: number,
    siteId: number,
    label: string,
  ): Promise<T> {
    this.requireId(id);
    const record = await manager.findOne(entity, {
      where: { id, siteId, deletedAt: IsNull() } as any,
      lock: { mode: 'pessimistic_read' },
    });
    if (!record)
      throw new BadRequestException(
        `${label} must belong to the selected site and not be deleted`,
      );
    return record;
  }

  private async lockCurrent<T extends ObjectLiteral>(
    manager: EntityManager,
    entity: EntityTarget<T>,
    id: number,
  ): Promise<T> {
    this.requireId(id);
    const record = await manager.findOne(entity, {
      where: { id, deletedAt: IsNull() } as any,
      lock: { mode: 'pessimistic_write' },
    });
    if (!record) throw new NotFoundException('CILT configuration not found');
    return record;
  }

  private requireId(id: number) {
    if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0)
      throw new BadRequestException('Invalid related ID');
  }

  private assertSameSite(siteId: number, requested?: number) {
    if (requested !== undefined && Number(requested) !== Number(siteId)) {
      throw new BadRequestException(
        'CILT configuration cannot be moved to another site',
      );
    }
  }

  private defined<T extends object>(input: T) {
    return Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    );
  }

  private validateTime(time: string) {
    if (
      typeof time !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(time)
    ) {
      throw new BadRequestException('Schedule must be in format HH:mm:ss');
    }
  }
}
