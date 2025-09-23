import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { UsersService } from '../users/users.service';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';

@Injectable()
export class CatalogService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly usersSevice: UsersService,
  ) {}

  getCatalogs = async (siteId: number, userId: number) => {
    try {
      const authUser = await this.usersSevice.findByIdWithSites(userId);
      if (!authUser || !authUser.userHasSites?.length) {
        throw new UnauthorizedException();
      }

      // Validar que el usuario tenga acceso al siteId solicitado
      const hasAccessToSite = authUser.userHasSites.some(userSite => userSite.site.id === siteId);
      if (!hasAccessToSite) {
        throw new UnauthorizedException();
      }
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
          SELECT c.*
          FROM cards c
          WHERE c.site_id = ? AND c.deleted_at IS NULL
          ORDER BY c.site_card_id DESC
        `, [siteId])
      ]);

      const evidencesResult = await queryRunner.query(`
        SELECT e.id, e.card_id as cardId, e.site_id as siteId, e.evidence_name as evidenceName,
               e.evidence_type as evidenceType, e.status, e.created_at as createdAt,
               e.updated_at as updatedAt, e.deleted_at as deletedAt
        FROM evidences e
        WHERE e.site_id = ? AND e.deleted_at IS NULL
      `, [siteId]);

      await queryRunner.release();

      const evidencesMap = new Map();
      evidencesResult.forEach((evidence) => {
        if (!evidencesMap.has(evidence.cardId)) {
          evidencesMap.set(evidence.cardId, []);
        }
        evidencesMap.get(evidence.cardId).push(evidence);
      });

      const cardsWithEvidences = cards.map(card => ({
        ...card,
        levelName: card.nodeName,
        evidences: evidencesMap.get(card.id) || []
      }));

      return {
        cardTypes,
        priorities,
        preclassifiers,
        levels,
        employees,
        cards: cardsWithEvidences
      };
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };
}