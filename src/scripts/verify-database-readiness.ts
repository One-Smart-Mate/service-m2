import 'dotenv/config';
import AppDataSource from '../config/data-source';

interface IndexRequirement {
  table: string;
  columns: string[];
}

const REQUIRED_MIGRATIONS = [
  'HardenAuthenticationSessionsAndFastPasswords1789689600000',
  'EnsureCardSyncIdempotency1790160000000',
  'CreateNotificationOutbox1790332800000',
  'OptimizeMobileCriticalQueries1790419200000',
];

const REQUIRED_INDEXES: IndexRequirement[] = [
  { table: 'cards', columns: ['card_UUID'] },
  { table: 'cards', columns: ['site_id', 'site_card_id'] },
  { table: 'cards', columns: ['site_id', 'sync_changed_at', 'id'] },
  { table: 'cards', columns: ['site_id', 'deleted_at', 'site_card_id'] },
  {
    table: 'evidences',
    columns: ['site_id', 'sync_changed_at', 'card_id'],
  },
  {
    table: 'evidences',
    columns: ['site_id', 'card_id', 'status', 'deleted_at'],
  },
  { table: 'users', columns: ['email'] },
  {
    table: 'user_has_sites',
    columns: ['user_id', 'deleted_at', 'status', 'site_id'],
  },
  {
    table: 'user_has_sites',
    columns: ['site_id', 'deleted_at', 'status', 'user_id'],
  },
  {
    table: 'notification_outbox',
    columns: ['status', 'available_at'],
  },
];

export function supportsSkipLocked(version: string): boolean {
  const match = version.match(/(\d+)\.(\d+)/);
  if (!match) {
    return false;
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  return version.toLowerCase().includes('mariadb')
    ? major > 10 || (major === 10 && minor >= 6)
    : major >= 8;
}

async function verifyDatabaseReadiness(): Promise<void> {
  await AppDataSource.initialize();
  try {
    const [server] = await AppDataSource.query(
      'SELECT VERSION() AS version, DATABASE() AS databaseName',
    );
    if (!server?.databaseName) {
      throw new Error('No database is selected');
    }
    if (!supportsSkipLocked(String(server.version))) {
      throw new Error(
        `Database ${server.version} does not support the required SKIP LOCKED semantics`,
      );
    }

    const engines: Array<{ tableName: string; engine: string }> =
      await AppDataSource.query(
        `
          SELECT TABLE_NAME AS tableName, ENGINE AS engine
          FROM information_schema.TABLES
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN ('cards', 'evidences', 'notification_outbox')
        `,
      );
    for (const tableName of ['cards', 'evidences', 'notification_outbox']) {
      const table = engines.find((item) => item.tableName === tableName);
      if (!table) {
        throw new Error(`Required table ${tableName} is missing`);
      }
      if (table.engine.toUpperCase() !== 'INNODB') {
        throw new Error(`${tableName} must use InnoDB`);
      }
    }

    const syncColumns: Array<{
      tableName: string;
      isNullable: string;
      extra: string;
    }> = await AppDataSource.query(
      `
        SELECT
          TABLE_NAME AS tableName,
          IS_NULLABLE AS isNullable,
          EXTRA AS extra
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN ('cards', 'evidences')
          AND COLUMN_NAME = 'sync_changed_at'
      `,
    );
    for (const tableName of ['cards', 'evidences']) {
      const column = syncColumns.find((item) => item.tableName === tableName);
      if (
        !column ||
        column.isNullable !== 'NO' ||
        !column.extra.toLowerCase().includes('on update')
      ) {
        throw new Error(
          `${tableName}.sync_changed_at is missing or incompatible`,
        );
      }
    }

    const indexRows: Array<{
      tableName: string;
      indexName: string;
      columnName: string;
      sequence: number;
    }> = await AppDataSource.query(
      `
        SELECT
          TABLE_NAME AS tableName,
          INDEX_NAME AS indexName,
          COLUMN_NAME AS columnName,
          SEQ_IN_INDEX AS sequence
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
      `,
    );
    const indexes = new Map<string, string[]>();
    for (const row of indexRows) {
      const key = `${row.tableName}:${row.indexName}`;
      const columns = indexes.get(key) ?? [];
      columns.push(row.columnName);
      indexes.set(key, columns);
    }
    for (const required of REQUIRED_INDEXES) {
      const found = [...indexes.entries()].some(
        ([key, columns]) =>
          key.startsWith(`${required.table}:`) &&
          required.columns.every(
            (column, index) => columns[index] === column,
          ),
      );
      if (!found) {
        throw new Error(
          `Missing index prefix ${required.table}(${required.columns.join(', ')})`,
        );
      }
    }

    const appliedMigrations: Array<{ name: string }> =
      await AppDataSource.query('SELECT name FROM migration_table');
    const appliedNames = new Set(appliedMigrations.map(({ name }) => name));
    const missingMigrations = REQUIRED_MIGRATIONS.filter(
      (name) => !appliedNames.has(name),
    );
    if (missingMigrations.length > 0) {
      throw new Error(
        `Missing required migrations: ${missingMigrations.join(', ')}`,
      );
    }

    process.stdout.write(
      `Database readiness verified for ${server.version}: migrations, InnoDB tables, sync columns and critical indexes are ready.\n`,
    );
  } finally {
    await AppDataSource.destroy();
  }
}

if (require.main === module) {
  verifyDatabaseReadiness().catch((error) => {
    process.stderr.write(
      `Database readiness verification failed: ${error instanceof Error ? error.message : 'unknown error'}\n`,
    );
    process.exitCode = 1;
  });
}
