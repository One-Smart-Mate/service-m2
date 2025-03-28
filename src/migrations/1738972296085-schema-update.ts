import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1738972296085 implements MigrationInterface {
    name = 'SchemaUpdate1738972296085'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`positions\` COMMENT ''`);
        await queryRunner.query(`ALTER TABLE \`users_positions\` COMMENT ''`);
        await queryRunner.query(`ALTER TABLE \`positions\` ADD \`created_at\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`positions\` ADD \`updated_at\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`positions\` ADD \`deleted_at\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`users_positions\` ADD \`user_id\` bigint UNSIGNED NULL`);
        await queryRunner.query(`ALTER TABLE \`users_positions\` ADD \`position_id\` int UNSIGNED NULL`);
        await queryRunner.query(`ALTER TABLE \`positions\` CHANGE \`ID\` \`ID\` int UNSIGNED NOT NULL AUTO_INCREMENT`);
        await queryRunner.query(`ALTER TABLE \`positions\` CHANGE \`category\` \`category\` varchar(45) NULL`);
        await queryRunner.query(`ALTER TABLE \`positions\` CHANGE \`currency_id\` \`currency_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`positions\` CHANGE \`currency_symbol\` \`currency_symbol\` char(3) NULL`);
        await queryRunner.query(`ALTER TABLE \`positions\` CHANGE \`description\` \`description\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`positions\` CHANGE \`hour_cost\` \`hour_cost\` decimal(10,2) NULL`);
        await queryRunner.query(`ALTER TABLE \`positions\` CHANGE \`name\` \`name\` varchar(45) NULL`);
        await queryRunner.query(`ALTER TABLE \`users_positions\` ADD CONSTRAINT \`FK_d5675610b5bcde6ea920500dd8f\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`users_positions\` ADD CONSTRAINT \`FK_b6ba8cad57c6f6b3648b71cbdd5\` FOREIGN KEY (\`position_id\`) REFERENCES \`positions\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users_positions\` DROP FOREIGN KEY \`FK_b6ba8cad57c6f6b3648b71cbdd5\``);
        await queryRunner.query(`ALTER TABLE \`users_positions\` DROP FOREIGN KEY \`FK_d5675610b5bcde6ea920500dd8f\``);
        await queryRunner.query(`ALTER TABLE \`users_positions\` DROP COLUMN \`position_id\``);
        await queryRunner.query(`ALTER TABLE \`users_positions\` DROP COLUMN \`user_id\``);
        await queryRunner.query(`ALTER TABLE \`positions\` DROP COLUMN \`deleted_at\``);
        await queryRunner.query(`ALTER TABLE \`positions\` DROP COLUMN \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`positions\` DROP COLUMN \`created_at\``);
    }
}
