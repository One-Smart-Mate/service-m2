import { InjectDataSource } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  ConflictException,
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
import {
  validateOrder,
  withSiteResourceTransaction,
  withSiteTransaction,
} from '../../common/database/site-transaction';
import { UpdateScheduleOrderDTO } from '../ciltSecuencesSchedule/models/dto/update-order.dto';
import { CreateCiltMstrPositionLevelsDto } from '../ciltMstrPositionLevels/model/create.ciltMstrPositionLevels.dto';
import { UpdateCiltMstrPositionLevelsDto } from '../ciltMstrPositionLevels/model/update.ciltMstrPositionLevels.dto';
import { CreateCiltSecuencesScheduleDto } from '../ciltSecuencesSchedule/models/dto/create.ciltSecuencesSchedule.dto';
import { UpdateCiltSecuencesScheduleDto } from '../ciltSecuencesSchedule/models/dto/update.ciltSecuencesSchedule.dto';

@Injectable()
export class CiltConfigurationPersistence {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  deleteAssignment(id: number) {
    return withSiteResourceTransaction(this.dataSource, CiltMstrPositionLevelsEntity, id,
      (manager, current) => manager.getRepository(CiltMstrPositionLevelsEntity).update(
        current.id, { status: 'I', deletedAt: new Date(), updatedAt: new Date() },
      ));
  }

  createAssignment(input: CreateCiltMstrPositionLevelsDto) {
    return withSiteTransaction(
      this.dataSource,
      input.siteId,
      async (manager) => {
        await this.validateAssignment(manager, input);
        return manager.save(
          manager.create(CiltMstrPositionLevelsEntity, {
            ...input,
            createdAt: new Date(),
          }),
        );
      },
    );
  }

  updateAssignment(input: UpdateCiltMstrPositionLevelsDto) {
    return withSiteResourceTransaction(
      this.dataSource,
      CiltMstrPositionLevelsEntity,
      input.id,
      async (manager, current) => {
        this.assertSameSite(current.siteId, input.siteId);
        const merged = Object.assign(current, this.defined(input));
        await this.validateAssignment(manager, merged);
        merged.updatedAt = new Date();
        return manager.save(merged);
      },
    );
  }

  createSchedules(input: CreateCiltSecuencesScheduleDto) {
    return withSiteTransaction(
      this.dataSource,
      input.siteId,
      async (manager) => {
        await this.validateSchedule(manager, input);
        if (!Array.isArray(input.schedules) || !input.schedules.length) {
          throw new BadRequestException(
            'At least one schedule time is required',
          );
        }
        input.schedules.forEach((time) => this.validateTime(time));
        const previous = await manager.findOne(CiltSecuencesScheduleEntity, {
          where: {
            siteId: input.siteId,
            secuenceId: input.secuenceId,
            deletedAt: IsNull(),
          },
          order: { order: 'DESC' },
        });
        const nextOrder = Number(previous?.order ?? 0) + 1;
        const { schedules, ...fields } = input;
        const entities = schedules.map((schedule, index) =>
          manager.create(CiltSecuencesScheduleEntity, {
            ...fields,
            schedule,
            order: validateOrder(nextOrder + index),
            createdAt: new Date(),
          }),
        );
        return manager.save(entities);
      },
    );
  }

  updateSchedule(input: UpdateCiltSecuencesScheduleDto) {
    return withSiteResourceTransaction(
      this.dataSource,
      CiltSecuencesScheduleEntity,
      input.id,
      async (manager, current) => {
        this.assertSameSite(current.siteId, input.siteId);
        const merged = Object.assign(current, this.defined(input));
        await this.validateSchedule(manager, merged);
        this.validateTime(merged.schedule);
        merged.updatedAt = new Date();
        return manager.save(merged);
      },
    );
  }

  updateScheduleOrder(input: UpdateScheduleOrderDTO) {
    const newOrder = validateOrder(input.newOrder);
    return withSiteResourceTransaction(
      this.dataSource,
      CiltSecuencesScheduleEntity,
      input.scheduleId,
      async (manager, current) => {
        if (current.status !== 'A')
          throw new ConflictException('Only active schedules can be reordered');
        if (Number(current.order) === newOrder) return current;
        const target = await manager.findOne(CiltSecuencesScheduleEntity, {
          where: {
            siteId: current.siteId,
            secuenceId: current.secuenceId,
            order: newOrder,
            status: 'A',
            deletedAt: IsNull(),
          },
          lock: { mode: 'pessimistic_write' },
        });
        const updatedAt = new Date();
        if (target)
          await manager.update(
            CiltSecuencesScheduleEntity,
            { id: target.id, deletedAt: IsNull() },
            { order: current.order, updatedAt },
          );
        await manager.update(
          CiltSecuencesScheduleEntity,
          { id: current.id, deletedAt: IsNull() },
          { order: newOrder, updatedAt },
        );
        return Object.assign(current, { order: newOrder, updatedAt });
      },
    );
  }

  deleteSchedule(id: number) {
    return withSiteResourceTransaction(
      this.dataSource,
      CiltSecuencesScheduleEntity,
      id,
      async (manager, current) => {
        const deletedAt = new Date();
        await manager.update(
          CiltSecuencesScheduleEntity,
          { id: current.id },
          { status: 'I', deletedAt, updatedAt: deletedAt },
        );
        return Object.assign(current, {
          status: 'I',
          deletedAt,
          updatedAt: deletedAt,
        });
      },
    );
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
