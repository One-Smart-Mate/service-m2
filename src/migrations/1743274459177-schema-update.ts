import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1743274459177 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`android_version\` varchar(15) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`ios_version\` varchar(15) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`web_version\` varchar(15) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`android_version\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`ios_version\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`web_version\``);
    }
}
