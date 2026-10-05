import { DataSource, QueryRunner } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { MysqlFixture } from './mysql-fixture';
import { verifyDatabaseSchema } from '../../src/common/database/database-readiness';
import { SiteEntity } from '../../src/modules/site/entities/site.entity';
import { CardEntity } from '../../src/modules/card/entities/card.entity';
import { EvidenceEntity } from '../../src/modules/evidence/entities/evidence.entity';
import { CardDeltaSyncReader } from '../../src/modules/card/card-delta-sync.reader';
import { CardSyncCursorPolicy } from '../../src/modules/card/card-sync-cursor.policy';
import { CommitOrderedCardSync1791072000004 } from '../../src/migrations/1791072000004-CommitOrderedCardSync';
import { UserEntity } from '../../src/modules/users/entities/user.entity';
import { UserHasSitesEntity } from '../../src/modules/users/entities/user.has.sites.entity';
import { UsersPositionsEntity } from '../../src/modules/users/entities/users.positions.entity';
import { LevelEntity } from '../../src/modules/level/entities/level.entity';
import { PositionEntity } from '../../src/modules/position/entities/position.entity';
import { CiltMstrEntity } from '../../src/modules/ciltMstr/entities/ciltMstr.entity';
import { CiltSequencesEntity } from '../../src/modules/ciltSequences/entities/ciltSequences.entity';
import { CiltMstrPositionLevelsEntity } from '../../src/modules/ciltMstrPositionLevels/entities/ciltMstrPositionLevels.entity';
import { CiltSecuencesScheduleEntity } from '../../src/modules/ciltSecuencesSchedule/entities/ciltSecuencesSchedule.entity';
import { CiltExecutionPersistence } from '../../src/modules/CiltSequencesExecutions/cilt-execution.persistence';
import { CiltSequencesExecutionsEntity } from '../../src/modules/CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import { CiltSequencesExecutionsEvidencesService } from '../../src/modules/CiltSequencesExecutionsEvidences/ciltSequencesExecutionsEvidences.service';
import { CiltSequencesExecutionsEvidencesEntity } from '../../src/modules/CiltSequencesExecutionsEvidences/entities/ciltSequencesExecutionsEvidences.entity';
import { OplMasterPersistence } from '../../src/modules/oplMstr/opl-master.persistence';
import { OplDetailPersistence } from '../../src/modules/oplDetails/opl-detail.persistence';
import { OplAccessPersistence } from '../../src/modules/oplMstr/opl-access.persistence';
import { OplMstr } from '../../src/modules/oplMstr/entities/oplMstr.entity';
import { OplDetailsEntity } from '../../src/modules/oplDetails/entities/oplDetails.entity';
import { NotificationOutboxProcessor } from '../../src/modules/notifications/notification-outbox.processor';
import {
  NotificationOutboxEntity,
  NotificationOutboxStatus,
} from '../../src/modules/notifications/entities/notification-outbox.entity';
import { AuthSessionService } from '../../src/modules/auth-session/auth-session.service';
import { AuthSessionEntity } from '../../src/modules/auth-session/entities/auth-session.entity';
import { retryDatabaseTransaction } from '../../src/common/database/site-transaction';

describe('MySQL migrations and concurrent backend writes', () => {
  const fixture = new MysqlFixture();
  let ds: DataSource;
  let reader: CardDeltaSyncReader;
  beforeAll(async () => {
    await fixture.initialize();
    ds = fixture.dataSource;
    reader = new CardDeltaSyncReader(ds);
  });
  afterAll(() => fixture.close());

  const site = () => fixture.seed(SiteEntity);
  const card = (siteId: number, siteCardId = 1) =>
    fixture.seed(CardEntity, { siteId, siteCardId });
  async function cilt() {
    const s = await site();
    const siteId = Number(s.id);
    const user = await fixture.seed(UserEntity, { status: 'A' });
    await fixture.seed(UserHasSitesEntity, { site: s, user, status: 'A' });
    const level = await fixture.seed(LevelEntity, { siteId, status: 'A' });
    const position = await fixture.seed(PositionEntity, {
      siteId,
      status: 'A',
    });
    await fixture.seed(UsersPositionsEntity, {
      siteId,
      userId: user.id,
      positionId: position.id,
    });
    const master = await fixture.seed(CiltMstrEntity, { siteId, status: 'A' });
    const sequence = await fixture.seed(CiltSequencesEntity, {
      siteId,
      ciltMstrId: master.id,
      status: 'A',
    });
    const assignment = await fixture.seed(CiltMstrPositionLevelsEntity, {
      siteId,
      ciltMstrId: master.id,
      positionId: position.id,
      levelId: Number(level.id),
      status: 'A',
    });
    const schedule = await fixture.seed(CiltSecuencesScheduleEntity, {
      siteId,
      ciltId: master.id,
      secuenceId: sequence.id,
      schedule: '08:00:00',
      status: 'A',
    });
    return {
      input: {
        siteId,
        ciltId: master.id,
        ciltSecuenceId: sequence.id,
        userId: Number(user.id),
        levelId: Number(level.id),
        positionId: position.id,
        secuenceSchedule: new Date('2026-10-05T08:00:00Z'),
        status: 'A',
      },
      provenance: { assignmentId: assignment.id, schedule, sequence },
    };
  }

  async function waitForWriter(table = 'card_sync_clock') {
    for (let i = 0; i < 200; i++) {
      const rows = await ds.query(
        `SELECT 1 FROM performance_schema.data_lock_waits w
        JOIN performance_schema.data_locks l ON l.ENGINE_LOCK_ID = w.REQUESTING_ENGINE_LOCK_ID
        WHERE l.OBJECT_SCHEMA = ? AND l.OBJECT_NAME = ? LIMIT 1`,
        [fixture.database, table],
      );
      if (rows.length) return;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error(`Second writer did not wait on ${table}`);
  }

  it('executes all ten required migrations and passes the actual readiness gate', async () => {
    await expect(verifyDatabaseSchema(ds)).resolves.toBeUndefined();
    const applied = await ds.query('SELECT name FROM migration_table');
    expect(applied).toHaveLength(10);
    const [session] = await ds.query('SELECT @@session.time_zone AS timezone');
    expect(session.timezone).toBe('+00:00');
  });

  it('supports rerunning the card sync migration without losing revisions', async () => {
    const s = await site();
    await card(Number(s.id));
    const before = await ds.query(
      'SELECT * FROM card_sync_clock WHERE site_id = ?',
      [s.id],
    );
    const runner = ds.createQueryRunner();
    try {
      await new CommitOrderedCardSync1791072000004().up(runner);
    } finally {
      await runner.release();
    }
    expect(
      await ds.query('SELECT * FROM card_sync_clock WHERE site_id = ?', [s.id]),
    ).toEqual(before);
    await expect(verifyDatabaseSchema(ds)).resolves.toBeUndefined();
  });

  it('returns all cards across paginated revision cursors', async () => {
    const s = await site();
    const ids = await Promise.all(
      Array.from({ length: 6 }, (_, i) => card(Number(s.id), i + 1)),
    );
    let cursor: string;
    const received: string[] = [];
    for (let i = 0; i < 10; i++) {
      const page = await reader.read(Number(s.id), cursor, 2);
      received.push(
        ...page.changes.map((change) =>
          change.type === 'upsert' ? String(change.card.id) : String(change.id),
        ),
      );
      cursor = page.nextCursor;
      if (!page.hasMore) break;
    }
    expect(new Set(received)).toEqual(
      new Set(ids.map((row) => String(row.id))),
    );
    for (let i = 0; i < 5; i++) {
      const empty = await reader.read(Number(s.id), cursor);
      expect(empty.changes).toHaveLength(0);
      cursor = empty.nextCursor;
    }
    await ds
      .getRepository(CardEntity)
      .update(ids[0].id, { nodeName: 'changed after empty polls' });
    const updated = await reader.read(Number(s.id), cursor);
    expect(updated.changes).toHaveLength(1);
    expect(updated.changes[0]).toMatchObject({
      type: 'upsert',
      card: { id: ids[0].id },
    });
  });

  it.each(['commit', 'rollback'] as const)(
    'keeps a later writer behind an earlier %s and never loses its delta',
    async (outcome) => {
      const s = await site();
      const a = await card(Number(s.id));
      const b = await card(Number(s.id), 2);
      const baseline = await reader.read(Number(s.id));
      const first = ds.createQueryRunner();
      const second = ds.createQueryRunner();
      let pending: Promise<void>;
      try {
        await first.startTransaction();
        await second.startTransaction();
        await first.query('UPDATE cards SET node_name = ? WHERE id = ?', [
          'first',
          a.id,
        ]);
        pending = second
          .query('UPDATE cards SET node_name = ? WHERE id = ?', [
            'second',
            b.id,
          ])
          .then(() => undefined);
        // Attach immediately, so an unexpected SQL failure cannot be unhandled.
        void pending.catch(() => undefined);
        await waitForWriter();
        const whileLocked = await reader.read(
          Number(s.id),
          baseline.nextCursor,
        );
        expect(whileLocked.changes).toHaveLength(0);
        if (outcome === 'commit') await first.commitTransaction();
        else await first.rollbackTransaction();
        await pending;
        await second.commitTransaction();
        const after = await reader.read(Number(s.id), whileLocked.nextCursor);
        expect(
          after.changes
            .map((change) => change.type === 'upsert' && String(change.card.id))
            .sort(),
        ).toEqual(
          (outcome === 'commit'
            ? [String(a.id), String(b.id)]
            : [String(b.id)]
          ).sort(),
        );
      } finally {
        for (const runner of [first, second]) {
          if (runner.isTransactionActive) await runner.rollbackTransaction();
          await runner.release();
        }
      }
    },
  );

  it('publishes evidence-only writes and physical card deletion as deltas', async () => {
    const s = await site();
    const c = await card(Number(s.id));
    const baseline = await reader.read(Number(s.id));
    const evidence = await fixture.seed(EvidenceEntity, {
      siteId: Number(s.id),
      cardId: Number(c.id),
      evidenceName: 'https://example.com/fixture',
      evidenceType: 'IMCL',
    });
    const withEvidence = await reader.read(Number(s.id), baseline.nextCursor);
    expect(withEvidence.changes[0].type).toBe('upsert');
    if (withEvidence.changes[0].type === 'upsert')
      expect(withEvidence.changes[0].card.evidences[0].id).toBe(evidence.id);
    await ds.getRepository(CardEntity).delete(c.id);
    const deleted = await reader.read(Number(s.id), withEvidence.nextCursor);
    expect(deleted.changes).toEqual([
      expect.objectContaining({ type: 'delete', cardUUID: c.cardUUID }),
    ]);
  });

  it('rejects evidence belonging to a different site at the database boundary', async () => {
    const a = await site();
    const b = await site();
    const c = await card(Number(a.id));
    await expect(
      fixture.seed(EvidenceEntity, {
        siteId: Number(b.id),
        cardId: Number(c.id),
      }),
    ).rejects.toThrow('Evidence must belong');
    await expect(
      ds.getRepository(CardEntity).update(c.id, { siteId: Number(b.id) }),
    ).rejects.toThrow('ownership is immutable');
  });

  it('generates a single scheduled CILT execution under twelve simultaneous callers', async () => {
    const { input, provenance } = await cilt();
    const persistence = new CiltExecutionPersistence(ds);
    const rows = await Promise.all(
      Array.from({ length: 12 }, () =>
        persistence.create(input, true, undefined, provenance),
      ),
    );
    expect(new Set(rows.map((row) => row.id)).size).toBe(1);
    expect(
      await ds
        .getRepository(CiltSequencesExecutionsEntity)
        .countBy({ siteId: input.siteId }),
    ).toBe(1);
    const next = await persistence.create(
      { ...input, secuenceSchedule: new Date('2026-10-06T08:00:00Z') },
      true,
      undefined,
      provenance,
    );
    expect(next.siteExecutionId).toBe(2);
  });

  it('rejects a generator snapshot changed by a committed configuration writer', async () => {
    const { input, provenance } = await cilt();
    const runner = ds.createQueryRunner();
    try {
      await runner.startTransaction();
      await runner.query('SELECT id FROM sites WHERE id = ? FOR UPDATE', [
        input.siteId,
      ]);
      await runner.manager.update(
        CiltSecuencesScheduleEntity,
        provenance.schedule.id,
        { toleranceBeforeMinutes: 10 },
      );
      const pending = new CiltExecutionPersistence(ds).create(
        input,
        true,
        undefined,
        provenance,
      );
      const observed = pending.then(
        () => 'created',
        (error) => error.message,
      );
      await runner.commitTransaction();
      expect(await observed).toContain('Schedule changed');
      expect(
        await ds
          .getRepository(CiltSequencesExecutionsEntity)
          .countBy({ siteId: input.siteId }),
      ).toBe(0);
    } finally {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      await runner.release();
    }
  });

  it('serializes evidence writes with completion and rejects mutation after completion', async () => {
    const { input, provenance } = await cilt();
    const persistence = new CiltExecutionPersistence(ds);
    const execution = await persistence.create(
      input,
      true,
      undefined,
      provenance,
    );
    await persistence.start({
      id: execution.id,
      startDate: '2026-10-05T08:00:00Z',
    });
    const service = new CiltSequencesExecutionsEvidencesService(
      ds,
      ds.getRepository(CiltSequencesExecutionsEvidencesEntity),
    );
    const dto = {
      ciltSequencesExecutionsId: execution.id,
      evidenceUrl: 'https://example.com/fixture',
      createdAt: '2026-10-05T08:01:00Z',
    };
    const first = await service.create(dto);
    await persistence.stop({
      id: execution.id,
      stopDate: '2026-10-05T08:02:00Z',
    });
    await expect(service.create(dto)).resolves.toEqual(first);
    await expect(
      service.create({ ...dto, evidenceUrl: 'https://example.com/different' }),
    ).rejects.toThrow('active execution');
    await expect(
      service.update({
        id: first.id,
        evidenceUrl: 'https://example.com/different',
      }),
    ).rejects.toThrow('active execution');
    await expect(service.delete(first.id)).rejects.toThrow('active execution');
  });

  it('allocates distinct first OPL and detail orders under simultaneous creation', async () => {
    const s = await site();
    const user = await fixture.seed(UserEntity, { status: 'A' });
    const persistence = new OplMasterPersistence(ds);
    const rows = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        persistence.create(
          {
            createdAt: '2026-10-05T08:00:00Z',
            siteId: Number(s.id),
            title: `OPL ${i}`,
          },
          Number(user.id),
        ),
      ),
    );
    expect(rows.map((row) => row.order).sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    const details = new OplDetailPersistence(ds);
    const children = await Promise.all(
      Array.from({ length: 10 }, () =>
        details.create({
          createdAt: '2026-10-05T08:00:00Z',
          oplId: rows[0].id,
          type: 'texto',
          text: 'fixture',
        }),
      ),
    );
    expect(children.map((row) => row.order).sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it('preserves OPL access counters during concurrent edits and swaps', async () => {
    const s = await site();
    const user = await fixture.seed(UserEntity, { status: 'A' });
    const persistence = new OplMasterPersistence(ds);
    const a = await persistence.create(
      { createdAt: '2026-10-05T08:00:00Z', siteId: Number(s.id), title: 'A' },
      Number(user.id),
    );
    const b = await persistence.create(
      { createdAt: '2026-10-05T08:00:00Z', siteId: Number(s.id), title: 'B' },
      Number(user.id),
    );
    const access = new OplAccessPersistence(ds);
    await Promise.all([
      ...Array.from({ length: 12 }, () => access.record(Number(user.id), a.id)),
      persistence.update({
        id: a.id,
        title: 'edited',
        updatedAt: '2026-10-05T08:00:00Z',
      }),
      persistence.updateOrder({ oplId: a.id, newOrder: 2 }),
      persistence.updateOrder({ oplId: b.id, newOrder: 1 }),
    ]);
    const updated = await ds
      .getRepository(OplMstr)
      .findOneByOrFail({ id: a.id });
    expect(updated.directUsageCount).toBe(12);
    expect(updated.title).toBe('edited');
    const [counter] = await ds.query(
      'SELECT access_count AS count FROM opl_user_access WHERE opl_id = ?',
      [a.id],
    );
    expect(counter.count).toBe(12);
    expect(
      (await ds.getRepository(OplMstr).findBy({ siteId: Number(s.id) }))
        .map((row) => row.order)
        .sort(),
    ).toEqual([1, 2]);
  });

  it('prevents creating details after the parent deletion commits', async () => {
    const s = await site();
    const opl = await fixture.seed(OplMstr, {
      siteId: Number(s.id),
      title: 'fixture',
    });
    await new OplMasterPersistence(ds).delete(opl.id);
    await expect(
      new OplDetailPersistence(ds).create({
        createdAt: '2026-10-05T08:00:00Z',
        oplId: opl.id,
        type: 'texto',
      }),
    ).rejects.toThrow('OPL not found');
    expect(
      await ds.getRepository(OplDetailsEntity).countBy({ oplId: opl.id }),
    ).toBe(0);
  });

  it('uses SKIP LOCKED to let two outbox workers claim different events', async () => {
    const events = await Promise.all(
      Array.from({ length: 2 }, () =>
        fixture.seed(NotificationOutboxEntity, {
          deduplicationKey: `fixture-${Math.random()}`,
          status: NotificationOutboxStatus.PENDING,
          availableAt: new Date('2026-01-01T00:00:00Z'),
          payload: {
            audience: { type: 'user', userId: 1 },
            notification: {
              title: 'fixture',
              description: 'fixture',
              type: 'fixture',
            },
          },
        }),
      ),
    );
    const blocker: QueryRunner = ds.createQueryRunner();
    try {
      await blocker.startTransaction();
      await blocker.query(
        'SELECT id FROM notification_outbox WHERE id = ? FOR UPDATE',
        [events[0].id],
      );
      const processor = new NotificationOutboxProcessor(ds, null, null, null);
      const claimed = await (processor as any).claimNext();
      expect(claimed.id).toBe(events[1].id);
      await blocker.commitTransaction();
      const next = await (processor as any).claimNext();
      expect(next.id).toBe(events[0].id);
      expect(next.attempts).toBe(1);
    } finally {
      if (blocker.isTransactionActive) await blocker.rollbackTransaction();
      await blocker.release();
    }
  });

  it('rejects a cursor bound to another site', async () => {
    const a = await site();
    const b = await site();
    const cursor = CardSyncCursorPolicy.encode(
      { revision: '0', id: '0' },
      Number(a.id),
    );
    expect(() => reader.read(Number(b.id), cursor)).toThrow();
  });
  it('blocks startup when the repair migration marker is missing', async () => {
    const name = 'RepairCardSyncClockLocking1791158400000';
    const [marker] = await ds.query(
      'SELECT * FROM migration_table WHERE name = ?',
      [name],
    );
    try {
      await ds.query('DELETE FROM migration_table WHERE name = ?', [name]);
      await expect(verifyDatabaseSchema(ds)).rejects.toThrow(name);
    } finally {
      await ds.query(
        'INSERT INTO migration_table (id, timestamp, name) VALUES (?, ?, ?)',
        [marker.id, marker.timestamp, marker.name],
      );
    }
  });
  it('paginates cards seeded at revision zero without replaying them', async () => {
    const runner = ds.createQueryRunner();
    const migration = new CommitOrderedCardSync1791072000004();
    let s: SiteEntity;
    const ids: string[] = [];
    try {
      await migration.down(runner);
      s = await site();
      for (let i = 1; i <= 5; i++)
        ids.push(String((await card(Number(s.id), i)).id));
    } finally {
      await migration.up(runner);
      await runner.release();
    }
    let cursor: string;
    const received: string[] = [];
    for (let i = 0; i < 5; i++) {
      const page = await reader.read(Number(s.id), cursor, 2);
      received.push(
        ...page.changes.map((change) =>
          change.type === 'upsert' ? String(change.card.id) : String(change.id),
        ),
      );
      cursor = page.nextCursor;
      if (!page.hasMore) break;
    }
    expect(received.sort()).toEqual(ids.sort());
    for (let i = 0; i < 3; i++) {
      const empty = await reader.read(Number(s.id), cursor);
      expect(empty.changes).toHaveLength(0);
      cursor = empty.nextCursor;
    }
  });
  it('allows only one concurrent refresh and revokes child sessions atomically', async () => {
    const s = await site();
    const user = await fixture.seed(UserEntity, { status: 'A' });
    await fixture.seed(UserHasSitesEntity, { site: s, user, status: 'A' });
    const session = await fixture.seed(AuthSessionEntity, {
      id: randomUUID(),
      userId: Number(user.id),
      sessionType: 'primary',
      platform: 'web',
      expiresAt: new Date(Date.now() + 3600000),
    });
    const child = await fixture.seed(AuthSessionEntity, {
      id: randomUUID(),
      userId: Number(user.id),
      actorId: Number(user.id),
      parentSessionId: session.id,
      sessionType: 'fast',
      platform: 'mobile',
      expiresAt: new Date(Date.now() + 3600000),
    });
    const service = new AuthSessionService(ds.getRepository(AuthSessionEntity));
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        service.rotateSession(
          session.id,
          Number(user.id),
          {
            id: randomUUID(),
            userId: Number(user.id),
            sessionType: 'primary',
            platform: 'web',
            expiresAt: new Date(Date.now() + 3600000),
          },
          Number(s.id),
        ),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
    await expect(
      service.isSessionActive(session.id, Number(user.id)),
    ).resolves.toBe(false);
    await expect(
      service.isSessionActive(child.id, Number(user.id)),
    ).resolves.toBe(false);
    const [active] = await ds.query(
      'SELECT COUNT(*) AS count FROM auth_sessions WHERE user_id = ? AND revoked_at IS NULL',
      [user.id],
    );
    expect(Number(active.count)).toBe(1);
  });
  it('recovers refresh from an InnoDB deadlock with a site writer', async () => {
    const s = await site();
    const user = await fixture.seed(UserEntity, { status: 'A' });
    await fixture.seed(UserHasSitesEntity, { site: s, user, status: 'A' });
    const session = await fixture.seed(AuthSessionEntity, {
      id: randomUUID(),
      userId: Number(user.id),
      sessionType: 'primary',
      platform: 'web',
    });
    let observed: Promise<boolean | string>;
    await retryDatabaseTransaction(ds, async (manager) => {
      await manager.query('SELECT id FROM sites WHERE id = ? FOR UPDATE', [
        s.id,
      ]);
      if (!observed) {
        const refresh = new AuthSessionService(
          ds.getRepository(AuthSessionEntity),
        ).rotateSession(
          session.id,
          Number(user.id),
          {
            id: randomUUID(),
            userId: Number(user.id),
            sessionType: 'primary',
            platform: 'web',
          },
          Number(s.id),
        );
        observed = refresh.then(
          (result) => result,
          (error) => error.message,
        );
        await waitForWriter('sites');
      }
      // The FK check and refresh form a real lock cycle. Both application
      // transactions must be able to recover, whichever victim MySQL selects.
      await manager.insert(CiltSequencesExecutionsEntity, {
        siteId: Number(s.id),
        userId: Number(user.id),
        siteExecutionId: 1,
        status: 'A',
      });
    });
    expect(await observed).toBe(true);
  });
});
