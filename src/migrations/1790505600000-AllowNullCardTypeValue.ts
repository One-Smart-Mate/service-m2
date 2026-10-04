import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Methodology M cards do not have a safe/unsafe classification. The creation
 * policy therefore persists null, so the database column must model the same
 * business rule instead of forcing an unrelated default value.
 */
export class AllowNullCardTypeValue1790505600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`cards\`
      MODIFY COLUMN \`cardType_value\` ENUM('safe', 'unsafe') NULL DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`cards\`
      SET \`cardType_value\` = 'unsafe'
      WHERE \`cardType_value\` IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`cards\`
      MODIFY COLUMN \`cardType_value\` ENUM('safe', 'unsafe') NOT NULL DEFAULT 'unsafe'
    `);
  }
}
