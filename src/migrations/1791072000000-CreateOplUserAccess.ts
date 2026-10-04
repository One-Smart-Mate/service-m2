import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOplUserAccess1791072000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('opl_user_access'))) {
      await queryRunner.createTable(
        new Table({
          name: 'opl_user_access',
          engine: 'InnoDB',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'user_id', type: 'bigint', unsigned: true },
            { name: 'opl_id', type: 'int', unsigned: true },
            {
              name: 'site_id',
              type: 'bigint',
              unsigned: true,
              isNullable: true,
            },
            { name: 'access_count', type: 'int', unsigned: true, default: '1' },
            {
              name: 'last_access_at',
              type: 'timestamp',
              isNullable: true,
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'created_at',
              type: 'timestamp',
              isNullable: true,
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
      );
    }
    const [duplicate] = await queryRunner.query(
      'SELECT user_id, opl_id FROM opl_user_access GROUP BY user_id, opl_id HAVING COUNT(*) > 1 LIMIT 1',
    );
    if (duplicate)
      throw new Error(
        'Cannot enforce OPL access uniqueness: duplicate user/OPL pairs exist',
      );
    const table = await queryRunner.getTable('opl_user_access');
    for (const index of [
      new TableIndex({
        name: 'uq_opl_user',
        columnNames: ['user_id', 'opl_id'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_opl_user_access_user',
        columnNames: ['user_id'],
      }),
    ]) {
      if (
        !table.indices.some((i) => i.name === index.name) &&
        !table.uniques.some((i) => i.name === index.name)
      )
        await queryRunner.createIndex(table, index);
    }
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('opl_user_access', true);
  }
}
