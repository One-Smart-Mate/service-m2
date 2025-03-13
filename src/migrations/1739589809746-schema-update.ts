import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaUpdate1739589809746 implements MigrationInterface {
  name = 'SchemaUpdate1739589809746';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`repository\` (
          \`ID\` int UNSIGNED NOT NULL AUTO_INCREMENT,
          \`cilt_id\` int UNSIGNED NOT NULL, 
          \`evidence_name\` varchar(255) NOT NULL,
          \`evidence_type\` varchar(10) NOT NULL,
          \`status\` char(1) NOT NULL DEFAULT 'A',
          \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          \`deleted_at\` timestamp(6) NULL,
          PRIMARY KEY (\`ID\`)
        ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`cilt\` (\`ID\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`tools_required\` text NULL, \`standard_ok\` tinyint NOT NULL DEFAULT 0, \`repository_url\` varchar(255) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`positions_cilt\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`position_id\` int UNSIGNED NULL, \`cilt_id\` int UNSIGNED NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`repository\` ADD CONSTRAINT \`FK_6153d9c5b413a4054c35dfbf01d\` FOREIGN KEY (\`cilt_id\`) REFERENCES \`cilt\`(\`ID\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE \`positions_cilt\` ADD CONSTRAINT \`FK_07cdc7bced09d6fbaebaa4f28a9\` 
            FOREIGN KEY (\`position_id\`) REFERENCES \`positions\`(\`ID\`) 
            ON DELETE CASCADE ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE \`positions_cilt\` ADD CONSTRAINT \`FK_dc9e0d05c22d076e2de5e1becb1\` 
            FOREIGN KEY (\`cilt_id\`) REFERENCES \`cilt\`(\`ID\`) 
            ON DELETE CASCADE ON UPDATE NO ACTION`);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`positions_cilt\` DROP FOREIGN KEY \`FK_dc9e0d05c22d076e2de5e1becb1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`positions_cilt\` DROP FOREIGN KEY \`FK_07cdc7bced09d6fbaebaa4f28a9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`repository\` DROP FOREIGN KEY \`FK_6153d9c5b413a4054c35dfbf01d\``,
    );
    await queryRunner.query(`DROP TABLE \`positions_cilt\``);
    await queryRunner.query(`DROP TABLE \`cilt\``);
    await queryRunner.query(`DROP TABLE \`repository\``);
  }
}
