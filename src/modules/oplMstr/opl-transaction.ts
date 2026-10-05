import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, IsNull } from 'typeorm';
import {
  positiveDatabaseId,
  retryDatabaseTransaction,
  withSiteTransaction,
} from '../../common/database/site-transaction';
import { OplMstr } from './entities/oplMstr.entity';

/** Site -> OPL -> detail; legacy global OPLs use their parent as the lock root. */
export async function withLockedOpl<T>(
  dataSource: DataSource,
  rawId: number,
  work: (manager: EntityManager, opl: OplMstr) => Promise<T>,
): Promise<T> {
  const id = positiveDatabaseId(rawId);
  const snapshot = await dataSource
    .getRepository(OplMstr)
    .findOne({ where: { id, deletedAt: IsNull() } });
  if (!snapshot) throw new NotFoundException('OPL not found');
  const locked = async (manager: EntityManager) => {
    if (snapshot.siteId === null) {
      // Global legacy resources share a stable root, even when it is soft deleted.
      // New OPLs require a site; no application path physically removes this root.
      await manager.findOne(OplMstr, {
        where: { siteId: IsNull() },
        order: { id: 'ASC' },
        withDeleted: true,
        lock: { mode: 'pessimistic_write' },
      });
    }

    const opl = await manager.findOne(OplMstr, {
      where: {
        id,
        siteId: snapshot.siteId === null ? IsNull() : snapshot.siteId,
        deletedAt: IsNull(),
      },
      lock: { mode: 'pessimistic_write' },
    });
    if (!opl) throw new NotFoundException('OPL not found');
    return work(manager, opl);
  };
  return snapshot.siteId === null
    ? retryDatabaseTransaction(dataSource, locked)
    : withSiteTransaction(dataSource, snapshot.siteId, locked);
}
