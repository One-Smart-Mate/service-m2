import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';

@Injectable()
export class CatalogService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  getCatalogs = async (siteId: number) => {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      
      const [cardTypes, priorities, preclassifiers, levels, employees, cards] = await Promise.all([
        queryRunner.query(`
          SELECT ct.id, ct.cardType_name as name, ct.color, ct.cardType_methodology_name as cardTypeMethodologyName, ct.cardType_methodology as cardTypeMethodology
          FROM card_types ct 
          WHERE ct.site_id = ? AND ct.deleted_at IS NULL
          ORDER BY ct.cardType_name
        `, [siteId]),
        
        queryRunner.query(`
          SELECT p.id, p.priority_code as priorityCode, p.priority_description as priorityDescription, p.priority_days as priorityDays
          FROM priorities p 
          WHERE p.site_id = ? AND p.deleted_at IS NULL
          ORDER BY p.priority_code
        `, [siteId]),
        
        queryRunner.query(`
          SELECT pc.id, pc.preclassifier_code as preclassifierCode, pc.preclassifier_description as preclassifierDescription
          FROM preclassifiers pc 
          WHERE pc.site_id = ? AND pc.deleted_at IS NULL
          ORDER BY pc.preclassifier_code
        `, [siteId]),
        
        queryRunner.query(`
          SELECT l.id, l.level_name as name, l.level, l.level_machine_id as levelMachineId, l.superior_id as superiorId, l.responsable_id as responsibleId, l.responsable_name as responsibleName
          FROM levels l 
          WHERE l.site_id = ? AND l.deleted_at IS NULL
          ORDER BY l.level, l.level_name
        `, [siteId]),
        
        queryRunner.query(`
          SELECT u.id, u.name, u.email, u.phone_number as phoneNumber, u.fast_password as fastPassword
          FROM users u
          INNER JOIN user_has_sites uhs ON u.id = uhs.user_id
          WHERE uhs.site_id = ? AND u.status = 'A' AND u.deleted_at IS NULL
          ORDER BY u.name
        `, [siteId]),
        
        queryRunner.query(`
          SELECT c.id, c.site_card_id as siteCardId, c.card_UUID as cardUUID, c.status, c.node_name as nodeName, 
                 c.area_name as areaName, c.creator_name as creatorName, c.cardType_name as cardTypeName,
                 c.mechanic_name as mechanicName, c.priority_code as priorityCode, c.priority_description as priorityDescription,
                 c.preclassifier_code as preclassifierCode, c.preclassifier_description as preclassifierDescription,
                 c.card_creation_date as cardCreationDate, c.card_due_date as cardDueDate
          FROM cards c 
          INNER JOIN sites s ON c.site_id = s.id
          WHERE c.site_id = ? AND c.deleted_at IS NULL 
          AND c.created_at >= DATE_SUB(NOW(), INTERVAL s.app_history_days DAY)
          ORDER BY c.site_card_id DESC
        `, [siteId])
      ]);

      await queryRunner.release();

      return {
        cardTypes,
        priorities,
        preclassifiers,
        levels,
        employees,
        cards
      };
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };
}