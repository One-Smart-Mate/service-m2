import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createConnection, Connection } from 'mysql2/promise';
import { DataSource, DeepPartial, EntityTarget, ObjectLiteral } from 'typeorm';
import { utcMysqlDriver } from '../../src/config/database-utc.config';
import { HardenAuthenticationSessionsAndFastPasswords1789689600000 } from '../../src/migrations/1789689600000-HardenAuthenticationSessionsAndFastPasswords';
import { EnsureCardSyncIdempotency1790160000000 } from '../../src/migrations/1790160000000-EnsureCardSyncIdempotency';
import { CreateNotificationOutbox1790332800000 } from '../../src/migrations/1790332800000-CreateNotificationOutbox';
import { OptimizeMobileCriticalQueries1790419200000 } from '../../src/migrations/1790419200000-OptimizeMobileCriticalQueries';
import { CreateOplUserAccess1791072000000 } from '../../src/migrations/1791072000000-CreateOplUserAccess';
import { HardenCiltExecutionIdentity1791072000001 } from '../../src/migrations/1791072000001-HardenCiltExecutionIdentity';
import { ReserveCardEvidenceUploads1791072000002 } from '../../src/migrations/1791072000002-ReserveCardEvidenceUploads';
import { AddSiteTimezone1791072000003 } from '../../src/migrations/1791072000003-AddSiteTimezone';
import { CommitOrderedCardSync1791072000004 } from '../../src/migrations/1791072000004-CommitOrderedCardSync';
import { RepairCardSyncClockLocking1791158400000 } from '../../src/migrations/1791158400000-RepairCardSyncClockLocking';

/** Never loads .env or DB_* and never drops an existing database. */
export class MysqlFixture {
  readonly database = `osm_test_${randomUUID().replace(/-/g, '')}`;
  dataSource: DataSource;
  private admin: Connection;
  private created = false;
  private sequence = 0;

  async initialize() {
    const socketPath = process.env.MYSQL_TEST_SOCKET;
    const host = process.env.MYSQL_TEST_HOST;
    if (!socketPath && !['127.0.0.1', 'localhost', '::1'].includes(host))
      throw new Error('MYSQL_TEST_HOST must explicitly select a loopback host');
    if (socketPath && !socketPath.startsWith('/'))
      throw new Error('MYSQL_TEST_SOCKET must be an absolute path');
    const port = Number(process.env.MYSQL_TEST_PORT ?? 3306);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error('Invalid MYSQL_TEST_PORT');
    const user = process.env.MYSQL_TEST_USER;
    if (!user) throw new Error('MYSQL_TEST_USER is required');
    const password = process.env.MYSQL_TEST_PASSWORD ?? '';
    this.admin = await createConnection({
      socketPath,
      host,
      port,
      user,
      password,
    });
    await this.admin.query(`CREATE DATABASE \`${this.database}\``);
    this.created = true;
    this.dataSource = new DataSource({
      type: 'mysql',
      connectorPackage: 'mysql2',
      driver: utcMysqlDriver,
      timezone: 'Z',
      socketPath,
      host,
      port,
      username: user,
      password,
      database: this.database,
      entities: [resolve('src/**/*.entity.ts')],
      synchronize: false,
      logging: false,
      migrationsTableName: 'migration_table',
      migrations: [
        HardenAuthenticationSessionsAndFastPasswords1789689600000,
        EnsureCardSyncIdempotency1790160000000,
        CreateNotificationOutbox1790332800000,
        OptimizeMobileCriticalQueries1790419200000,
        CreateOplUserAccess1791072000000,
        HardenCiltExecutionIdentity1791072000001,
        ReserveCardEvidenceUploads1791072000002,
        AddSiteTimezone1791072000003,
        CommitOrderedCardSync1791072000004,
        RepairCardSyncClockLocking1791158400000,
      ],
      extra: { connectionLimit: 20 },
    });
    await this.dataSource.initialize();
    // This baseline comes from current entities, not a production dump.
    await this.dataSource.synchronize();
    const runner = this.dataSource.createQueryRunner();
    try {
      // Exercise actual migration DDL for objects introduced by the audits.
      for (const migration of [
        new HardenAuthenticationSessionsAndFastPasswords1789689600000(),
        new CreateNotificationOutbox1790332800000(),
        new CreateOplUserAccess1791072000000(),
        new ReserveCardEvidenceUploads1791072000002(),
        new HardenCiltExecutionIdentity1791072000001(),
        new OptimizeMobileCriticalQueries1790419200000(),
        new AddSiteTimezone1791072000003(),
        new EnsureCardSyncIdempotency1790160000000(),
      ])
        await migration.down(runner);
      const oldPepper = process.env.FAST_PASSWORD_PEPPER;
      process.env.FAST_PASSWORD_PEPPER =
        'isolated-fixture-pepper-with-at-least-32-bytes';
      try {
        await this.dataSource.runMigrations({ transaction: 'none' });
      } finally {
        if (oldPepper === undefined) delete process.env.FAST_PASSWORD_PEPPER;
        else process.env.FAST_PASSWORD_PEPPER = oldPepper;
      }
    } finally {
      await runner.release();
    }
  }

  async seed<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    input?: DeepPartial<T>,
  ): Promise<T> {
    const repository = this.dataSource.getRepository(entity);
    const defaults: ObjectLiteral = {};
    const serial = ++this.sequence;
    for (const column of repository.metadata.columns) {
      if (
        column.isGenerated ||
        column.isNullable ||
        column.default !== undefined ||
        column.relationMetadata
      )
        continue;
      const type = String(column.type).toLowerCase();
      defaults[column.propertyName] =
        column.enum?.[0] ??
        (type === 'json'
          ? {}
          : /date|timestamp/.test(type)
            ? new Date('2026-10-05T08:00:00Z')
            : type === 'time'
              ? '08:00:00'
              : /int|decimal|float|double|number/.test(type)
                ? 1
                : type === 'boolean'
                  ? false
                  : `f${serial}`.slice(0, Number(column.length) || 100));
    }
    const row = repository.create({ ...defaults, ...input } as DeepPartial<T>);
    return repository.save(row);
  }

  async close() {
    if (this.dataSource?.isInitialized) await this.dataSource.destroy();
    if (this.created)
      await this.admin.query(`DROP DATABASE \`${this.database}\``);
    await this.admin?.end();
  }
}
