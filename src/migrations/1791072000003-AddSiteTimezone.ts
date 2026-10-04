import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSiteTimezone1791072000003 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('sites', 'timezone')) return;
    await queryRunner.addColumn(
      'sites',
      new TableColumn({
        name: 'timezone',
        type: 'varchar',
        length: '64',
        isNullable: false,
        default: "'America/Mexico_City'",
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('sites', 'timezone')) {
      await queryRunner.dropColumn('sites', 'timezone');
    }
  }
}
