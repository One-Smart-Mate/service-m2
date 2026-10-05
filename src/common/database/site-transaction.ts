import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  EntityTarget,
  IsNull,
  ObjectLiteral,
} from 'typeorm';
import { SiteEntity } from '../../modules/site/entities/site.entity';

export function positiveDatabaseId(value: unknown): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0)
    throw new BadRequestException('A positive integer is required');
  return id;
}

export function validateOrder(value: unknown): number {
  const order = positiveDatabaseId(value);
  // The current order columns are signed TINYINT.
  if (order > 127)
    throw new BadRequestException('Order must be between 1 and 127');
  return order;
}

/** Retry only transactions MySQL explicitly aborted, never uncertain network failures. */
export async function retryDatabaseTransaction<T>(
  dataSource: DataSource,
  work: (manager: EntityManager) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await dataSource.transaction('READ COMMITTED', work);
    } catch (error) {
      const driver = error?.driverError ?? error;
      if (
        attempt >= 2 ||
        (driver?.code !== 'ER_LOCK_DEADLOCK' && driver?.errno !== 1213)
      )
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 25 * 2 ** attempt));
    }
  }
}

export function withSiteTransaction<T>(
  dataSource: DataSource,
  rawSiteId: number,
  work: (manager: EntityManager) => Promise<T>,
): Promise<T> {
  const siteId = positiveDatabaseId(rawSiteId);
  return retryDatabaseTransaction(dataSource, async (manager) => {
    const site = await manager.findOne(SiteEntity, {
      where: { id: siteId, status: 'A', deletedAt: IsNull() },
      lock: { mode: 'pessimistic_write' },
    });
    if (!site) throw new NotFoundException('Active site not found');
    return work(manager);
  });
}

/** The snapshot selects the lock root; only the locked, fresh entity is mutated. */
export async function withSiteResourceTransaction<
  T extends ObjectLiteral & { id: number; siteId: number },
  R,
>(
  dataSource: DataSource,
  entity: EntityTarget<T>,
  rawId: number,
  work: (manager: EntityManager, current: T) => Promise<R>,
): Promise<R> {
  const id = positiveDatabaseId(rawId);
  const snapshot = await dataSource
    .getRepository(entity)
    .findOne({ where: { id, deletedAt: IsNull() } as any });
  if (!snapshot) throw new NotFoundException('Resource not found');
  const siteId = positiveDatabaseId(snapshot.siteId);
  return withSiteTransaction(dataSource, siteId, async (manager) => {
    const current = await manager.findOne(entity, {
      where: { id, siteId, deletedAt: IsNull() } as any,
      lock: { mode: 'pessimistic_write' },
    });
    if (!current) throw new NotFoundException('Resource not found');
    return work(manager, current);
  });
}
