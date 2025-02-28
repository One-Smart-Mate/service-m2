import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFindAreaCardsGroupedByMachineSP16740627590699 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE PROCEDURE findAreaCardsGroupedByMachine (
          IN p_siteId INT,
          IN p_areaId INT,
          IN p_startDate DATETIME,
          IN p_endDate DATETIME
      )
      BEGIN
          SELECT 
              node_name AS nodeName,
              card_location AS location,
              COUNT(*) AS totalCards,
              cardType_name AS cardTypeName
          FROM cards
          WHERE site_id = p_siteId
            AND area_id = p_areaId
            /* Si ambos p_startDate y p_endDate no son NULL, filtra */
            AND (
              (p_startDate IS NULL OR p_endDate IS NULL)
              OR (created_at BETWEEN p_startDate AND CONCAT(p_endDate, ' 23:59:59'))
            )
          GROUP BY cardType_name, node_name, card_location;
      END;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP PROCEDURE IF EXISTS findAreaCardsGroupedByMachine;`);
  }
}
