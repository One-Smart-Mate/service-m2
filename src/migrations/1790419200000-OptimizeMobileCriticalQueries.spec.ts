import { QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';
import { OptimizeMobileCriticalQueries1790419200000 } from './1790419200000-OptimizeMobileCriticalQueries';

describe('OptimizeMobileCriticalQueries migration', () => {
  const migration = new OptimizeMobileCriticalQueries1790419200000();
  const requirements = (migration as any).indexes as Array<{
    table: string;
    name: string;
    columns: string[];
  }>;

  const buildTables = () => {
    const columnsByTable = new Map<string, Set<string>>();
    for (const requirement of requirements) {
      const columns = columnsByTable.get(requirement.table) ?? new Set();
      requirement.columns
        .filter((column) => column !== 'sync_changed_at')
        .forEach((column) => columns.add(column));
      columnsByTable.set(requirement.table, columns);
    }

    return new Map(
      [...columnsByTable].map(([name, columns]) => [
        name,
        new Table({
          name,
          columns: [...columns].map(
            (column) => new TableColumn({ name: column, type: 'varchar' }),
          ),
        }),
      ]),
    );
  };

  const createRunner = (tables = buildTables()) =>
    ({
      getTable: jest.fn((name) => Promise.resolve(tables.get(name))),
      hasColumn: jest.fn().mockResolvedValue(false),
      query: jest.fn().mockResolvedValue(undefined),
      createIndex: jest.fn().mockResolvedValue(undefined),
    }) as unknown as QueryRunner;

  it('adds database-maintained sync clocks and every missing critical index', async () => {
    const runner = createRunner();

    await migration.up(runner);

    expect(runner.query).toHaveBeenCalledTimes(2);
    expect(runner.query).toHaveBeenCalledWith(
      expect.stringContaining(
        'sync_changed_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)',
      ),
    );
    expect(runner.createIndex).toHaveBeenCalledTimes(requirements.length);
    expect(runner.createIndex).toHaveBeenCalledWith(
      'cards',
      expect.objectContaining({
        name: 'idx_cards_site_sync',
        columnNames: ['site_id', 'sync_changed_at', 'id'],
      }),
    );
  });

  it('fails before changing data when a required legacy column is missing', async () => {
    const tables = buildTables();
    tables.get('cards').removeColumn(
      tables.get('cards').findColumnByName('site_id'),
    );
    const runner = createRunner(tables);

    await expect(migration.up(runner)).rejects.toThrow(
      'cards is missing site_id',
    );
    expect(runner.query).not.toHaveBeenCalled();
    expect(runner.createIndex).not.toHaveBeenCalled();
  });

  it('does not duplicate an equivalent index with another name', async () => {
    const tables = buildTables();
    tables.get('users').indices.push(
      new TableIndex({
        name: 'legacy_email_index',
        columnNames: ['email', 'status'],
      }),
    );
    const runner = createRunner(tables);

    await migration.up(runner);

    expect(runner.createIndex).not.toHaveBeenCalledWith(
      'users',
      expect.objectContaining({ name: 'idx_users_email' }),
    );
  });

  it('rejects a known index name with incompatible columns', async () => {
    const tables = buildTables();
    tables.get('cards').indices.push(
      new TableIndex({
        name: 'idx_cards_site_sync',
        columnNames: ['site_id', 'id'],
      }),
    );
    const runner = createRunner(tables);

    await expect(migration.up(runner)).rejects.toThrow(
      'idx_cards_site_sync exists with incompatible columns',
    );
  });
});
