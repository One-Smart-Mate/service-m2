import { DataSource } from 'typeorm';

interface IndexRequirement {
  table: string;
  columns: string[];
  unique?: boolean;
}

const REQUIRED_MIGRATIONS = [
  'HardenAuthenticationSessionsAndFastPasswords1789689600000',
  'EnsureCardSyncIdempotency1790160000000',
  'CreateNotificationOutbox1790332800000',
  'OptimizeMobileCriticalQueries1790419200000',
  'CreateOplUserAccess1791072000000',
  'HardenCiltExecutionIdentity1791072000001',
  'ReserveCardEvidenceUploads1791072000002',
  'AddSiteTimezone1791072000003',
  'CommitOrderedCardSync1791072000004',
];

const REQUIRED_INDEXES: IndexRequirement[] = [
  { table: 'opl_user_access', columns: ['user_id', 'opl_id'], unique: true },
  { table: 'opl_user_access', columns: ['user_id'] },
  {
    table: 'card_evidence_uploads',
    columns: ['site_id', 'card_uuid', 'evidence_type', 'evidence_id'],
    unique: true,
  },
  { table: 'card_evidence_uploads', columns: ['object_key'], unique: true },
  {
    table: 'cilt_sequences_executions',
    columns: ['site_id', 'site_execution_id'],
    unique: true,
  },
  {
    table: 'cilt_sequences_executions',
    columns: [
      'site_id',
      'cilt_id',
      'cilt_secuence_id',
      'user_id',
      'level_id',
      'position_id',
      'secuence_schedule',
    ],
    unique: true,
  },
  { table: 'card_sync_changes', columns: ['site_id', 'revision', 'card_id'] },
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
  { table: 'users', columns: ['fast_password_digest'] },
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

export async function verifyDatabaseSchema(
  dataSource: DataSource,
): Promise<void> {
  const [server] = await dataSource.query(
    'SELECT VERSION() AS version, DATABASE() AS databaseName, @@session.time_zone AS sessionTimezone',
  );
  if (
    server?.sessionTimezone !== '+00:00' ||
    !('timezone' in dataSource.options) ||
    dataSource.options.timezone !== 'Z'
  ) {
    throw new Error('Database driver and session must use UTC');
  }
  if (!server?.databaseName) {
    throw new Error('No database is selected');
  }
  if (!supportsSkipLocked(String(server.version))) {
    throw new Error(
      `Database ${server.version} does not support the required SKIP LOCKED semantics`,
    );
  }

  const engines: Array<{ tableName: string; engine: string }> =
    await dataSource.query(
      `
          SELECT TABLE_NAME AS tableName, ENGINE AS engine
          FROM information_schema.TABLES
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN ('card_sync_clock', 'card_sync_changes', 'cards', 'evidences', 'notification_outbox', 'opl_user_access', 'card_evidence_uploads', 'cilt_sequences_executions', 'sites', 'users', 'user_has_sites', 'positions', 'users_positions', 'cilt_mstr', 'cilt_sequences', 'cilt_sequences_schedule', 'cilt_mstr_position_levels')
        `,
    );
  for (const tableName of [
    'card_sync_clock',
    'card_sync_changes',
    'cards',
    'evidences',
    'notification_outbox',
    'opl_user_access',
    'card_evidence_uploads',
    'cilt_sequences_executions',
    'sites',
    'users',
    'user_has_sites',
    'positions',
    'users_positions',
    'cilt_mstr',
    'cilt_sequences',
    'cilt_sequences_schedule',
    'cilt_mstr_position_levels',
  ]) {
    const table = engines.find((item) => item.tableName === tableName);
    if (!table) {
      throw new Error(`Required table ${tableName} is missing`);
    }
    if (table.engine.toUpperCase() !== 'INNODB') {
      throw new Error(`${tableName} must use InnoDB`);
    }
  }

  const [siteTimezoneColumn] = await dataSource.query(`
      SELECT IS_NULLABLE AS isNullable FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sites' AND COLUMN_NAME = 'timezone'
    `);
  if (siteTimezoneColumn?.isNullable !== 'NO') {
    throw new Error('sites.timezone must exist and be non-nullable');
  }

  const syncColumns: Array<{
    tableName: string;
    isNullable: string;
    extra: string;
  }> = await dataSource.query(
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
    nonUnique: number;
  }> = await dataSource.query(
    `
        SELECT
          TABLE_NAME AS tableName,
          INDEX_NAME AS indexName,
          COLUMN_NAME AS columnName,
          SEQ_IN_INDEX AS sequence,
          NON_UNIQUE AS nonUnique
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
      `,
  );
  const indexes = new Map<string, string[]>();
  const uniqueIndexes = new Set<string>();
  for (const row of indexRows) {
    const key = `${row.tableName}:${row.indexName}`;
    if (Number(row.nonUnique) === 0) uniqueIndexes.add(key);
    const columns = indexes.get(key) ?? [];
    columns.push(row.columnName);
    indexes.set(key, columns);
  }
  for (const required of REQUIRED_INDEXES) {
    const found = [...indexes.entries()].some(
      ([key, columns]) =>
        key.startsWith(`${required.table}:`) &&
        (!required.unique ||
          (uniqueIndexes.has(key) &&
            columns.length === required.columns.length)) &&
        required.columns.every((column, index) => columns[index] === column),
    );
    if (!found) {
      throw new Error(
        `Missing index prefix ${required.table}(${required.columns.join(', ')})`,
      );
    }
  }

  const appliedMigrations: Array<{ name: string }> = await dataSource.query(
    'SELECT name FROM migration_table',
  );
  const appliedNames = new Set(appliedMigrations.map(({ name }) => name));
  const missingMigrations = REQUIRED_MIGRATIONS.filter(
    (name) => !appliedNames.has(name),
  );
  if (missingMigrations.length > 0) {
    throw new Error(
      `Missing required migrations: ${missingMigrations.join(', ')}`,
    );
  }

  await dataSource.query(
    'SELECT site_id, revision FROM card_sync_clock LIMIT 0',
  );
  await dataSource.query(
    'SELECT card_id, site_id, revision, card_uuid, changed_at, deleted_at FROM card_sync_changes LIMIT 0',
  );
  const triggers: Array<{ name: string }> = await dataSource.query(
    'SELECT TRIGGER_NAME AS name FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE()',
  );
  const names = new Set(triggers.map((row) => row.name));
  for (const table of ['cards', 'evidences'])
    for (const event of ['insert', 'update', 'delete'])
      if (!names.has(`card_sync_${table}_${event}`))
        throw new Error('Card sync triggers are missing');
}
