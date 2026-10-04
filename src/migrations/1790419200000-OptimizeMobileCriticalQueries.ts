import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

interface RequiredIndex {
  table: string;
  name: string;
  columns: string[];
}

export class OptimizeMobileCriticalQueries1790419200000
  implements MigrationInterface
{
  private readonly indexes: RequiredIndex[] = [
    {
      table: 'cards',
      name: 'idx_cards_site_sync',
      columns: ['site_id', 'sync_changed_at', 'id'],
    },
    {
      table: 'cards',
      name: 'idx_cards_site_list',
      columns: ['site_id', 'deleted_at', 'site_card_id'],
    },
    {
      table: 'cards',
      name: 'idx_cards_site_status_creation',
      columns: ['site_id', 'deleted_at', 'status', 'card_creation_date'],
    },
    {
      table: 'evidences',
      name: 'idx_evidences_site_sync',
      columns: ['site_id', 'sync_changed_at', 'card_id'],
    },
    {
      table: 'evidences',
      name: 'idx_evidences_site_card_state',
      columns: ['site_id', 'card_id', 'status', 'deleted_at'],
    },
    {
      table: 'users',
      name: 'idx_users_email',
      columns: ['email'],
    },
    {
      table: 'user_has_sites',
      name: 'idx_uhs_user_state',
      columns: ['user_id', 'deleted_at', 'status', 'site_id'],
    },
    {
      table: 'user_has_sites',
      name: 'idx_uhs_site_state',
      columns: ['site_id', 'deleted_at', 'status', 'user_id'],
    },
    {
      table: 'card_types',
      name: 'idx_card_types_site_state',
      columns: ['site_id', 'status', 'deleted_at', 'id'],
    },
    {
      table: 'priorities',
      name: 'idx_priorities_site_state_order',
      columns: ['site_id', 'status', 'deleted_at', 'order', 'id'],
    },
    {
      table: 'preclassifiers',
      name: 'idx_preclassifiers_site_state_type',
      columns: [
        'site_id',
        'status',
        'deleted_at',
        'cardType_id',
        'id',
      ],
    },
    {
      table: 'levels',
      name: 'idx_levels_site_state_depth',
      columns: ['site_id', 'status', 'deleted_at', 'level', 'id'],
    },
    {
      table: 'levels',
      name: 'idx_levels_site_parent_state',
      columns: ['site_id', 'superior_id', 'deleted_at', 'status'],
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.assertRequiredSchema(queryRunner);
    await this.ensureSyncTimestamp(queryRunner, 'cards');
    await this.ensureSyncTimestamp(queryRunner, 'evidences');

    for (const index of this.indexes) {
      await this.ensureIndex(queryRunner, index);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const index of [...this.indexes].reverse()) {
      const table = await queryRunner.getTable(index.table);
      if (table?.indices.some((existing) => existing.name === index.name)) {
        await queryRunner.dropIndex(index.table, index.name);
      }
    }

    for (const tableName of ['evidences', 'cards']) {
      if (await queryRunner.hasColumn(tableName, 'sync_changed_at')) {
        await queryRunner.dropColumn(tableName, 'sync_changed_at');
      }
    }
  }

  private async assertRequiredSchema(queryRunner: QueryRunner): Promise<void> {
    const requirements: Record<string, string[]> = {};
    for (const index of this.indexes) {
      requirements[index.table] = [
        ...new Set([
          ...(requirements[index.table] ?? []),
          ...index.columns.filter((column) => column !== 'sync_changed_at'),
        ]),
      ];
    }

    for (const [tableName, columns] of Object.entries(requirements)) {
      const table = await queryRunner.getTable(tableName);
      if (!table) {
        throw new Error(
          `Cannot optimize mobile queries: ${tableName} table is missing`,
        );
      }
      const missingColumns = columns.filter(
        (column) => !table.findColumnByName(column),
      );
      if (missingColumns.length > 0) {
        throw new Error(
          `Cannot optimize mobile queries: ${tableName} is missing ${missingColumns.join(', ')}`,
        );
      }
    }
  }

  private async ensureSyncTimestamp(
    queryRunner: QueryRunner,
    tableName: 'cards' | 'evidences',
  ): Promise<void> {
    if (!(await queryRunner.hasColumn(tableName, 'sync_changed_at'))) {
      await queryRunner.query(
        `ALTER TABLE \`${tableName}\` ADD COLUMN \`sync_changed_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
      );
      return;
    }

    const table = await queryRunner.getTable(tableName);
    const column = table?.findColumnByName('sync_changed_at');
    if (
      !column ||
      column.type !== 'timestamp' ||
      column.isNullable ||
      !column.onUpdate?.toUpperCase().includes('CURRENT_TIMESTAMP')
    ) {
      throw new Error(
        `Cannot optimize mobile queries: ${tableName}.sync_changed_at has an incompatible definition`,
      );
    }
  }

  private async ensureIndex(
    queryRunner: QueryRunner,
    required: RequiredIndex,
  ): Promise<void> {
    const table = await queryRunner.getTable(required.table);
    if (!table) {
      throw new Error(`Table ${required.table} disappeared during migration`);
    }

    const namedIndex = table.indices.find(
      (index) => index.name === required.name,
    );
    if (namedIndex) {
      if (!this.hasPrefix(namedIndex.columnNames, required.columns)) {
        throw new Error(
          `Index ${required.name} exists with incompatible columns`,
        );
      }
      return;
    }

    if (
      table.indices.some((index) =>
        this.hasPrefix(index.columnNames, required.columns),
      )
    ) {
      return;
    }

    await queryRunner.createIndex(
      required.table,
      new TableIndex({
        name: required.name,
        columnNames: required.columns,
      }),
    );
  }

  private hasPrefix(actual: string[], expected: string[]): boolean {
    return expected.every((column, index) => actual[index] === column);
  }
}
