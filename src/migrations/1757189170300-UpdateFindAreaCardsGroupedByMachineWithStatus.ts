import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFindAreaCardsGroupedByMachineWithStatus1757189170300 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing stored procedure
        await queryRunner.query(`DROP PROCEDURE IF EXISTS findAreaCardsGroupedByMachine;`);
        
        // Create the updated stored procedure with status filtering
        await queryRunner.query(`
            CREATE PROCEDURE findAreaCardsGroupedByMachine (
                IN p_siteId INT,
                IN p_areaId INT,
                IN p_startDate DATETIME,
                IN p_endDate DATETIME,
                IN p_status VARCHAR(50)
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
                  AND (
                    (p_status IS NOT NULL AND FIND_IN_SET(status, p_status) > 0)
                    OR (p_status IS NULL AND status = 'A')
                  )
                  AND (
                    (p_startDate IS NULL OR p_endDate IS NULL)
                    OR (created_at BETWEEN p_startDate AND CONCAT(p_endDate, ' 23:59:59'))
                  )
                GROUP BY cardType_name, node_name, card_location;
            END;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the updated stored procedure
        await queryRunner.query(`DROP PROCEDURE IF EXISTS findAreaCardsGroupedByMachine;`);
        
        // Restore the original stored procedure without status filtering
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
                  AND (
                    (p_startDate IS NULL OR p_endDate IS NULL)
                    OR (created_at BETWEEN p_startDate AND CONCAT(p_endDate, ' 23:59:59'))
                  )
                GROUP BY cardType_name, node_name, card_location;
            END;
        `);
    }

}
