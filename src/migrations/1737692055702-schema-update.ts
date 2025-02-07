import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1737692055702 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`users\` CHANGE COLUMN \`name\` \`name\` INT`
          );          
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
