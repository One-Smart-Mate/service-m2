import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull } from 'typeorm';
import { OplMstr } from './entities/oplMstr.entity';

@Injectable()
export class OplAccessPersistence {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  record(userId: number, oplId: number): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const opl = await manager.findOne(OplMstr, {
        where: { id: oplId, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!opl) throw new NotFoundException('OPL not found');
      const now = new Date();
      await manager.query(
        `INSERT INTO opl_user_access
        (user_id, opl_id, site_id, access_count, last_access_at, created_at) VALUES (?, ?, ?, 1, ?, ?)
        ON DUPLICATE KEY UPDATE access_count = access_count + 1, last_access_at = VALUES(last_access_at), site_id = VALUES(site_id)`,
        [userId, oplId, opl.siteId, now, now],
      );
      await manager
        .createQueryBuilder()
        .update(OplMstr)
        .set({
          directUsageCount: () => 'COALESCE(direct_usage_count, 0) + 1',
          lastUsedAt: now,
        })
        .where('id = :id', { id: oplId })
        .execute();
    });
  }
}
