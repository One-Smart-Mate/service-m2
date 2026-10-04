import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, DeepPartial, EntityManager, IsNull } from 'typeorm';
import { CiltSequencesExecutionsEntity } from './entities/ciltSequencesExecutions.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { PositionEntity } from '../position/entities/position.entity';
import { LevelEntity } from '../level/entities/level.entity';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { CiltSequencesEntity } from '../ciltSequences/entities/ciltSequences.entity';
import { CiltTypesEntity } from '../ciltTypes/entities/ciltTypes.entity';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { CardEntity } from '../card/entities/card.entity';
import { UserHasSitesEntity } from '../users/entities/user.has.sites.entity';
import { UserEntity } from '../users/entities/user.entity';
import {
  NotificationOutboxEntity,
  NotificationOutboxStatus,
} from '../notifications/entities/notification-outbox.entity';
import { stringConstants } from 'src/utils/string.constant';

type ExecutionInput = DeepPartial<CiltSequencesExecutionsEntity>;

@Injectable()
export class CiltExecutionPersistence {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  create(
    input: ExecutionInput,
    scheduled = false,
  ): Promise<CiltSequencesExecutionsEntity> {
    return this.dataSource.transaction(async (manager) => {
      const siteId = Number(input.siteId);
      if (!Number.isSafeInteger(siteId) || siteId <= 0)
        throw new BadRequestException('Valid site is required');
      const site = await manager.findOne(SiteEntity, {
        where: { id: siteId, status: 'A' },
        lock: { mode: 'pessimistic_write' },
      });
      if (!site) throw new NotFoundException('Active site not found');
      const repository = manager.getRepository(CiltSequencesExecutionsEntity);
      const scheduledAt = input.secuenceSchedule
        ? new Date(input.secuenceSchedule as Date)
        : null;
      if (scheduledAt && Number.isNaN(scheduledAt.getTime()))
        throw new BadRequestException('Invalid execution date');
      if (scheduledAt) scheduledAt.setMilliseconds(0);
      if (scheduled) {
        for (const field of [
          'ciltId',
          'ciltSecuenceId',
          'userId',
          'levelId',
          'positionId',
        ]) {
          if (
            !Number.isSafeInteger(Number(input[field])) ||
            Number(input[field]) <= 0
          ) {
            throw new BadRequestException(
              `${field} is required for scheduled executions`,
            );
          }
        }
        if (!scheduledAt)
          throw new BadRequestException('Execution schedule is required');
      }
      if (
        scheduledAt &&
        ['ciltId', 'ciltSecuenceId', 'userId', 'levelId', 'positionId'].every(
          (field) => Number(input[field]) > 0,
        )
      ) {
        const existing = await repository.findOne({
          where: {
            siteId,
            ciltId: Number(input.ciltId),
            ciltSecuenceId: Number(input.ciltSecuenceId),
            userId: Number(input.userId),
            levelId: Number(input.levelId),
            positionId: Number(input.positionId),
            secuenceSchedule: scheduledAt,
          },
        });
        // A cancelled/deleted schedule is not recreated by the daily generator.
        if (existing) return existing;
      }
      await this.validateRelations(manager, input, siteId);
      const last = await repository.findOne({
        where: { siteId },
        order: { siteExecutionId: 'DESC' },
      });
      const execution = repository.create({
        ...input,
        siteId,
        secuenceSchedule: scheduledAt,
        siteExecutionId: Number(last?.siteExecutionId ?? 0) + 1,
      });
      return repository.save(execution);
    });
  }

  update(
    input: ExecutionInput & { id: number },
  ): Promise<CiltSequencesExecutionsEntity> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(CiltSequencesExecutionsEntity);
      const execution = await repository.findOne({
        where: { id: input.id, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!execution) throw new NotFoundException('Execution not found');
      for (const field of [
        'siteId',
        'positionId',
        'levelId',
        'ciltId',
        'ciltSecuenceId',
        'userId',
        'siteExecutionId',
        'secuenceSchedule',
      ]) {
        if (
          input[field] !== undefined &&
          (field === 'secuenceSchedule'
            ? new Date(input[field] as Date).getTime() !==
              new Date(execution[field]).getTime()
            : Number(input[field]) !== Number(execution[field]))
        ) {
          throw new BadRequestException(
            `Execution ${field} cannot be reassigned`,
          );
        }
      }
      const normalized = { ...execution, ...input, updatedAt: new Date() };
      await this.validateRelations(
        manager,
        normalized,
        Number(execution.siteId),
      );
      Object.assign(execution, normalized);
      const saved = await repository.save(execution);
      if (input.stoppageReason === true)
        await this.enqueueStoppage(manager, saved);
      return saved;
    });
  }

  private async validateRelations(
    manager: EntityManager,
    input: ExecutionInput,
    siteId: number,
  ): Promise<void> {
    if (!Number.isSafeInteger(siteId) || siteId <= 0)
      throw new BadRequestException('Execution site is required');
    const references = [
      [PositionEntity, input.positionId],
      [LevelEntity, input.levelId],
      [CiltMstrEntity, input.ciltId],
      [CiltTypesEntity, input.ciltTypeId],
      [OplMstr, input.referenceOplSopId],
      [OplMstr, input.remediationOplSopId],
      [CardEntity, input.amTagId],
    ] as const;
    for (const [entity, rawId] of references) {
      if (rawId == null || Number(rawId) === 0) continue;
      const id = Number(rawId);
      if (
        !Number.isSafeInteger(id) ||
        id <= 0 ||
        !(await manager.findOne(entity as any, {
          where: { id, siteId, deletedAt: IsNull() },
        }))
      )
        throw new BadRequestException(
          'Execution references must belong to its site',
        );
    }
    if (input.ciltSecuenceId) {
      const sequence = await manager.findOne(CiltSequencesEntity, {
        where: {
          id: Number(input.ciltSecuenceId),
          siteId,
          ciltMstrId: Number(input.ciltId),
          deletedAt: IsNull(),
        },
      });
      if (!sequence)
        throw new BadRequestException(
          'Execution sequence does not belong to its master and site',
        );
    }
    for (const userId of new Set(
      [input.userId, input.userWhoExecutedId].filter((id) => id != null),
    )) {
      if (
        !(await manager.exists(UserHasSitesEntity, {
          where: {
            user: { id: Number(userId), status: 'A' },
            site: { id: siteId },
            status: 'A',
          },
        }))
      ) {
        throw new BadRequestException(
          'Execution user must be active and assigned to its site',
        );
      }
    }
  }

  private async enqueueStoppage(
    manager: EntityManager,
    execution: CiltSequencesExecutionsEntity,
  ): Promise<void> {
    const eventKey = `cilt-stoppage:${execution.id}`;
    if (
      await manager.exists(NotificationOutboxEntity, {
        where: { deduplicationKey: `${eventKey}:0` },
      })
    )
      return;
    const position = await manager.findOne(PositionEntity, {
      where: {
        id: execution.positionId,
        siteId: execution.siteId,
        deletedAt: IsNull(),
      },
    });
    if (!position?.nodeResponsableId) return;
    const user = await manager.findOne(UserEntity, {
      where: { id: position.nodeResponsableId, status: 'A' },
    });
    if (
      !user ||
      !(await manager.exists(UserHasSitesEntity, {
        where: {
          user: { id: user.id },
          site: { id: execution.siteId },
          status: 'A',
        },
      }))
    )
      return;
    const now = new Date();
    const notification = {
      title: stringConstants.ciltTitle,
      description: `La posición ${position.name} ha reportado una condición de paro`,
      type: stringConstants.ciltNotificationType,
    };
    const payloads = [
      { audience: { type: 'user' as const, userId: user.id }, notification },
      ...(user.email
        ? [
            {
              audience: { type: 'user' as const, userId: user.id },
              notification,
              email: {
                type: 'cilt-stoppage' as const,
                userId: user.id,
                positionName: position.name,
                translation:
                  user.translation === 'EN' ? ('EN' as const) : ('ES' as const),
              },
            },
          ]
        : []),
    ];
    await manager.save(
      NotificationOutboxEntity,
      payloads.map((payload, index) =>
        manager.create(NotificationOutboxEntity, {
          deduplicationKey: `${eventKey}:${index}`,
          payload,
          status: NotificationOutboxStatus.PENDING,
          attempts: 0,
          availableAt: now,
          createdAt: now,
          updatedAt: now,
        }),
      ),
    );
  }
}
