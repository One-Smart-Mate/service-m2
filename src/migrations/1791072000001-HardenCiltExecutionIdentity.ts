import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

const indexes = [
  new TableIndex({
    name: 'uq_cilt_execution_schedule',
    columnNames: [
      'site_id',
      'cilt_id',
      'cilt_secuence_id',
      'user_id',
      'level_id',
      'position_id',
      'secuence_schedule',
    ],
    isUnique: true,
  }),
  new TableIndex({
    name: 'uq_cilt_execution_folio',
    columnNames: ['site_id', 'site_execution_id'],
    isUnique: true,
  }),
];

export class HardenCiltExecutionIdentity1791072000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Fail before DDL when historical duplicates need reconciliation. Never delete execution history.
    for (const index of indexes) {
      const columns = index.columnNames.join(', ');
      const nonNull = index.columnNames
        .map((column) => `${column} IS NOT NULL`)
        .join(' AND ');
      const [duplicate] = await queryRunner.query(
        `SELECT ${columns} FROM cilt_sequences_executions WHERE ${nonNull} GROUP BY ${columns} HAVING COUNT(*) > 1 LIMIT 1`,
      );
      if (duplicate)
        throw new Error(
          `Cannot create ${index.name}: reconcile duplicate executions before migration`,
        );
    }
    const table = await queryRunner.getTable('cilt_sequences_executions');
    for (const index of indexes) {
      if (!table.indices.some((i) => i.name === index.name))
        await queryRunner.createIndex(table, index);
    }
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('cilt_sequences_executions');
    for (const index of indexes) {
      if (table.indices.some((i) => i.name === index.name))
        await queryRunner.dropIndex(table, index.name);
    }
  }
}
