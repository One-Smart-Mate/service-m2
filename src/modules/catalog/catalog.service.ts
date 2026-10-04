import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { UsersService } from '../users/users.service';
import { CatalogSnapshotReader } from './catalog-snapshot.reader';
import { CatalogPaginationPolicy } from './catalog-pagination.policy';

@Injectable()
export class CatalogService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly usersSevice: UsersService,
    private readonly catalogSnapshotReader: CatalogSnapshotReader,
  ) {}

  private validateSiteAccess = async (siteId: number, userId: number) => {
    const normalizedSiteId = Number(siteId);
    if (!Number.isSafeInteger(normalizedSiteId) || normalizedSiteId <= 0) {
      throw new BadRequestException('Invalid siteId');
    }

    const accessibleSiteIds = await this.usersSevice.getAccessibleSiteIds(
      userId,
    );
    if (
      accessibleSiteIds !== null &&
      !accessibleSiteIds.includes(normalizedSiteId)
    ) {
      throw new UnauthorizedException('Site access denied');
    }

    return normalizedSiteId;
  };

  getOfflineSnapshot = async (siteId: number, userId: number) => {
    const normalizedSiteId = await this.validateSiteAccess(siteId, userId);
    return this.catalogSnapshotReader.read(normalizedSiteId);
  };

  getCatalogs = async (siteId: number, userId: number) => {
    siteId = await this.validateSiteAccess(siteId, userId);
    try {
      
      const [cardTypes, priorities, preclassifiers, levels, employees, cards] = await Promise.all([
        this.dataSource.query(`
          SELECT
            ct.id,
            ct.site_id as siteId,
            ct.cardType_methodology as cardTypeMethodology,
            ct.cardType_methodology_name as methodology,
            ct.cardType_name as name,
            ct.cardType_description as description,
            ct.color,
            ct.responsable_id as responsableId,
            ct.responsable_name as responsableName,
            ct.status,
            ct.quantity_pictures_create as quantityPicturesCreate,
            ct.quantity_audios_create as quantityAudiosCreate,
            ct.quantity_videos_create as quantityVideosCreate,
            ct.audios_duration_create as audiosDurationCreate,
            ct.videos_duration_create as videosDurationCreate,
            ct.quantity_pictures_close as quantityPicturesClose,
            ct.quantity_audios_close as quantityAudiosClose,
            ct.quantity_videos_close as quantityVideosClose,
            ct.audios_duration_close as audiosDurationClose,
            ct.videos_duration_close as videosDurationClose,
            ct.quantity_pictures_ps as quantityPicturesPs,
            ct.quantity_audios_ps as quantityAudiosPs,
            ct.quantity_videos_ps as quantityVideosPs,
            ct.audios_duration_ps as audiosDurationPs,
            ct.videos_duration_ps as videosDurationPs
          FROM card_types ct
          WHERE ct.site_id = ? AND ct.deleted_at IS NULL
          ORDER BY ct.cardType_name
        `, [siteId]),
        
        this.dataSource.query(`
          SELECT p.id, p.priority_code as priorityCode, p.priority_description as priorityDescription, p.priority_days as priorityDays, p.status
          FROM priorities p
          WHERE p.site_id = ? AND p.deleted_at IS NULL
          ORDER BY p.priority_code
        `, [siteId]),
        
        this.dataSource.query(`
          SELECT pc.id, pc.cardType_id as cardTypeId, pc.preclassifier_code as preclassifierCode, pc.preclassifier_description as preclassifierDescription, pc.status
          FROM preclassifiers pc
          WHERE pc.site_id = ? AND pc.deleted_at IS NULL
          ORDER BY pc.preclassifier_code
        `, [siteId]),
        
        this.dataSource.query(`
          SELECT l.id, l.level_name as name, l.level, l.level_machine_id as levelMachineId, l.superior_id as superiorId, l.responsable_id as responsibleId, l.responsable_name as responsibleName
          FROM levels l 
          WHERE l.site_id = ? AND l.deleted_at IS NULL
          ORDER BY l.level, l.level_name
        `, [siteId]),
        
        this.dataSource.query(`
          SELECT u.id, u.name, u.email,
                 GROUP_CONCAT(r.name) as roles
          FROM users u
          INNER JOIN user_has_sites uhs ON u.id = uhs.user_id
          LEFT JOIN user_role ur ON u.id = ur.user_id
          LEFT JOIN role r ON ur.role_id = r.id
          WHERE uhs.site_id = ?
            AND uhs.status = 'A'
            AND uhs.deleted_at IS NULL
            AND u.status = 'A'
            AND u.deleted_at IS NULL
          GROUP BY u.id, u.name, u.email
          ORDER BY u.name
        `, [siteId]),
        
        this.dataSource.query(`
          SELECT
            c.id,
            c.site_card_id as siteCardId,
            c.site_id as siteId,
            c.site_code as siteCode,
            c.card_UUID as cardUUID,
            c.cardType_color as cardTypeColor,
            c.feasibility,
            c.effect,
            c.status,
            c.card_creation_date as cardCreationDate,
            c.card_due_date as cardDueDate,
            c.card_location as cardLocation,
            c.area_id as areaId,
            c.area_name as areaName,
            c.node_id as nodeId,
            c.node_name as nodeName,
            c.level,
            c.superior_id as superiorId,
            c.priority_id as priorityId,
            c.priority_code as priorityCode,
            c.priority_description as priorityDescription,
            c.cardType_methodology as cardTypeMethodology,
            c.cardType_methodology_name as cardTypeMethodologyName,
            c.cardType_value as cardTypeValue,
            c.cardType_id as cardTypeId,
            c.cardType_name as cardTypeName,
            c.preclassifier_id as preclassifierId,
            c.preclassifier_code as preclassifierCode,
            c.preclassifier_description as preclassifierDescription,
            c.creator_id as creatorId,
            c.creator_name as creatorName,
            c.responsable_id as responsableId,
            c.responsable_name as responsableName,
            c.mechanic_id as mechanicId,
            c.mechanic_name as mechanicName,
            c.user_provisional_solution_id as userProvisionalSolutionId,
            c.user_provisional_solution_name as userProvisionalSolutionName,
            c.user_app_provisional_solution_id as userAppProvisionalSolutionId,
            c.user_app_provisional_solution_name as userAppProvisionalSolutionName,
            c.user_definitive_solution_id as userDefinitiveSolutionId,
            c.user_definitive_solution_name as userDefinitiveSolutionName,
            c.user_app_definitive_solution_id as userAppDefinitiveSolutionId,
            c.user_app_definitive_solution_name as userAppDefinitiveSolutionName,
            c.manager_id as managerId,
            c.manager_name as managerName,
            c.card_manager_close_date as cardManagerCloseDate,
            c.comments_manager_at_card_close as commentsManagerAtCardClose,
            c.comments_at_card_creation as commentsAtCardCreation,
            c.card_provisional_solution_date as cardProvisionalSolutionDate,
            c.comments_at_card_provisional_solution as commentsAtCardProvisionalSolution,
            c.card_definitive_solution_date as cardDefinitiveSolutionDate,
            c.comments_at_card_definitive_solution as commentsAtCardDefinitiveSolution,
            c.evidence_aucr as evidenceAucr,
            c.evidence_vicr as evidenceVicr,
            c.evidence_imcr as evidenceImcr,
            c.evidence_aucl as evidenceAucl,
            c.evidence_vicl as evidenceVicl,
            c.evidence_imcl as evidenceImcl,
            c.created_at as createdAt,
            c.updated_at as updatedAt,
            c.deleted_at as deletedAt,
            c.evidence_aups as evidenceAups,
            c.evidence_vips as evidenceVips,
            c.evidence_imps as evidenceImps,
            c.tag_origin as tagOrigin,
            c.cilt_secuence_execution_id as ciltSecuenceExecutionId,
            c.route,
            c.am_discard_reason_id as amDiscardReasonId,
            c.discard_reason as discardReason,
            c.app_version as appVersion,
            c.app_so as appSo
          FROM cards c
          WHERE c.site_id = ? AND c.deleted_at IS NULL
          ORDER BY c.site_card_id DESC
        `, [siteId])
      ]);

      const evidencesResult = await this.dataSource.query(`
        SELECT e.id, e.card_id as cardId, e.site_id as siteId, e.evidence_name as evidenceName,
               e.evidence_type as evidenceType, e.status, e.created_at as createdAt,
               e.updated_at as updatedAt, e.deleted_at as deletedAt
        FROM evidences e
        WHERE e.site_id = ? AND e.deleted_at IS NULL
      `, [siteId]);

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
      HandleException.exception(exception);
    }
  };
  getCatalogsPaginated = async (siteId: number, userId: number, page: number = 1, limit: number = 200) => {
    const pagination = CatalogPaginationPolicy.normalize(page, limit);
    page = pagination.page;
    limit = pagination.limit;
    siteId = await this.validateSiteAccess(siteId, userId);
    try {
      const offset = pagination.offset;

      // Execute all paginated queries and count queries in parallel
      const [
        cardTypes,
        cardTypesCount,
        priorities,
        prioritiesCount,
        preclassifiers,
        preclassifiersCount,
        levels,
        levelsCount,
        employees,
        employeesCount,
        cards,
        cardsCount
      ] = await Promise.all([
        // Card Types - data
        this.dataSource.query(`
          SELECT
            ct.id,
            ct.site_id as siteId,
            ct.cardType_methodology as cardTypeMethodology,
            ct.cardType_methodology_name as methodology,
            ct.cardType_name as name,
            ct.cardType_description as description,
            ct.color,
            ct.responsable_id as responsableId,
            ct.responsable_name as responsableName,
            ct.status,
            ct.quantity_pictures_create as quantityPicturesCreate,
            ct.quantity_audios_create as quantityAudiosCreate,
            ct.quantity_videos_create as quantityVideosCreate,
            ct.audios_duration_create as audiosDurationCreate,
            ct.videos_duration_create as videosDurationCreate,
            ct.quantity_pictures_close as quantityPicturesClose,
            ct.quantity_audios_close as quantityAudiosClose,
            ct.quantity_videos_close as quantityVideosClose,
            ct.audios_duration_close as audiosDurationClose,
            ct.videos_duration_close as videosDurationClose,
            ct.quantity_pictures_ps as quantityPicturesPs,
            ct.quantity_audios_ps as quantityAudiosPs,
            ct.quantity_videos_ps as quantityVideosPs,
            ct.audios_duration_ps as audiosDurationPs,
            ct.videos_duration_ps as videosDurationPs
          FROM card_types ct
          WHERE ct.site_id = ? AND ct.deleted_at IS NULL
          ORDER BY ct.cardType_name
          LIMIT ? OFFSET ?
        `, [siteId, limit, offset]),
        // Card Types - count
        this.dataSource.query(`
          SELECT COUNT(*) as total FROM card_types WHERE site_id = ? AND deleted_at IS NULL
        `, [siteId]),

        // Priorities - data
        this.dataSource.query(`
          SELECT p.id, p.priority_code as priorityCode, p.priority_description as priorityDescription, p.priority_days as priorityDays, p.status
          FROM priorities p
          WHERE p.site_id = ? AND p.deleted_at IS NULL
          ORDER BY p.priority_code
          LIMIT ? OFFSET ?
        `, [siteId, limit, offset]),
        // Priorities - count
        this.dataSource.query(`
          SELECT COUNT(*) as total FROM priorities WHERE site_id = ? AND deleted_at IS NULL
        `, [siteId]),

        // Preclassifiers - data
        this.dataSource.query(`
          SELECT pc.id, pc.cardType_id as cardTypeId, pc.preclassifier_code as preclassifierCode, pc.preclassifier_description as preclassifierDescription, pc.status
          FROM preclassifiers pc
          WHERE pc.site_id = ? AND pc.deleted_at IS NULL
          ORDER BY pc.preclassifier_code
          LIMIT ? OFFSET ?
        `, [siteId, limit, offset]),
        // Preclassifiers - count
        this.dataSource.query(`
          SELECT COUNT(*) as total FROM preclassifiers WHERE site_id = ? AND deleted_at IS NULL
        `, [siteId]),

        // Levels - data
        this.dataSource.query(`
          SELECT l.id, l.level_name as name, l.level, l.level_machine_id as levelMachineId, l.superior_id as superiorId, l.responsable_id as responsibleId, l.responsable_name as responsibleName
          FROM levels l
          WHERE l.site_id = ? AND l.deleted_at IS NULL
          ORDER BY l.level, l.level_name
          LIMIT ? OFFSET ?
        `, [siteId, limit, offset]),
        // Levels - count
        this.dataSource.query(`
          SELECT COUNT(*) as total FROM levels WHERE site_id = ? AND deleted_at IS NULL
        `, [siteId]),

        // Employees - data
        this.dataSource.query(`
          SELECT u.id, u.name, u.email,
                 GROUP_CONCAT(r.name) as roles
          FROM users u
          INNER JOIN user_has_sites uhs ON u.id = uhs.user_id
          LEFT JOIN user_role ur ON u.id = ur.user_id
          LEFT JOIN role r ON ur.role_id = r.id
          WHERE uhs.site_id = ?
            AND uhs.status = 'A'
            AND uhs.deleted_at IS NULL
            AND u.status = 'A'
            AND u.deleted_at IS NULL
          GROUP BY u.id, u.name, u.email
          ORDER BY u.name
          LIMIT ? OFFSET ?
        `, [siteId, limit, offset]),
        // Employees - count
        this.dataSource.query(`
          SELECT COUNT(DISTINCT u.id) as total
          FROM users u
          INNER JOIN user_has_sites uhs ON u.id = uhs.user_id
          WHERE uhs.site_id = ?
            AND uhs.status = 'A'
            AND uhs.deleted_at IS NULL
            AND u.status = 'A'
            AND u.deleted_at IS NULL
        `, [siteId]),

        // Cards - data
        this.dataSource.query(`
          SELECT
            c.id,
            c.site_card_id as siteCardId,
            c.site_id as siteId,
            c.site_code as siteCode,
            c.card_UUID as cardUUID,
            c.cardType_color as cardTypeColor,
            c.feasibility,
            c.effect,
            c.status,
            c.card_creation_date as cardCreationDate,
            c.card_due_date as cardDueDate,
            c.card_location as cardLocation,
            c.area_id as areaId,
            c.area_name as areaName,
            c.node_id as nodeId,
            c.node_name as nodeName,
            c.level,
            c.superior_id as superiorId,
            c.priority_id as priorityId,
            c.priority_code as priorityCode,
            c.priority_description as priorityDescription,
            c.cardType_methodology as cardTypeMethodology,
            c.cardType_methodology_name as cardTypeMethodologyName,
            c.cardType_value as cardTypeValue,
            c.cardType_id as cardTypeId,
            c.cardType_name as cardTypeName,
            c.preclassifier_id as preclassifierId,
            c.preclassifier_code as preclassifierCode,
            c.preclassifier_description as preclassifierDescription,
            c.creator_id as creatorId,
            c.creator_name as creatorName,
            c.responsable_id as responsableId,
            c.responsable_name as responsableName,
            c.mechanic_id as mechanicId,
            c.mechanic_name as mechanicName,
            c.user_provisional_solution_id as userProvisionalSolutionId,
            c.user_provisional_solution_name as userProvisionalSolutionName,
            c.user_app_provisional_solution_id as userAppProvisionalSolutionId,
            c.user_app_provisional_solution_name as userAppProvisionalSolutionName,
            c.user_definitive_solution_id as userDefinitiveSolutionId,
            c.user_definitive_solution_name as userDefinitiveSolutionName,
            c.user_app_definitive_solution_id as userAppDefinitiveSolutionId,
            c.user_app_definitive_solution_name as userAppDefinitiveSolutionName,
            c.manager_id as managerId,
            c.manager_name as managerName,
            c.card_manager_close_date as cardManagerCloseDate,
            c.comments_manager_at_card_close as commentsManagerAtCardClose,
            c.comments_at_card_creation as commentsAtCardCreation,
            c.card_provisional_solution_date as cardProvisionalSolutionDate,
            c.comments_at_card_provisional_solution as commentsAtCardProvisionalSolution,
            c.card_definitive_solution_date as cardDefinitiveSolutionDate,
            c.comments_at_card_definitive_solution as commentsAtCardDefinitiveSolution,
            c.evidence_aucr as evidenceAucr,
            c.evidence_vicr as evidenceVicr,
            c.evidence_imcr as evidenceImcr,
            c.evidence_aucl as evidenceAucl,
            c.evidence_vicl as evidenceVicl,
            c.evidence_imcl as evidenceImcl,
            c.created_at as createdAt,
            c.updated_at as updatedAt,
            c.deleted_at as deletedAt,
            c.evidence_aups as evidenceAups,
            c.evidence_vips as evidenceVips,
            c.evidence_imps as evidenceImps,
            c.tag_origin as tagOrigin,
            c.cilt_secuence_execution_id as ciltSecuenceExecutionId,
            c.route,
            c.am_discard_reason_id as amDiscardReasonId,
            c.discard_reason as discardReason,
            c.app_version as appVersion,
            c.app_so as appSo
          FROM cards c
          WHERE c.site_id = ? AND c.deleted_at IS NULL
          ORDER BY c.site_card_id DESC
          LIMIT ? OFFSET ?
        `, [siteId, limit, offset]),
        // Cards - count
        this.dataSource.query(`
          SELECT COUNT(*) as total FROM cards WHERE site_id = ? AND deleted_at IS NULL
        `, [siteId])
      ]);

      // Get evidences for the paginated cards
      let cardsWithEvidences = [];
      if (cards && cards.length > 0) {
        const cardIds = cards.map((card: any) => card.id);
        const evidencesResult = await this.dataSource.query(`
          SELECT e.id, e.card_id as cardId, e.site_id as siteId, e.evidence_name as evidenceName,
                 e.evidence_type as evidenceType, e.status, e.created_at as createdAt,
                 e.updated_at as updatedAt, e.deleted_at as deletedAt
          FROM evidences e
          WHERE e.card_id IN (?)
            AND e.site_id = ?
            AND e.deleted_at IS NULL
        `, [cardIds, siteId]);

        const evidencesMap = new Map();
        evidencesResult.forEach((evidence: any) => {
          if (!evidencesMap.has(evidence.cardId)) {
            evidencesMap.set(evidence.cardId, []);
          }
          evidencesMap.get(evidence.cardId).push(evidence);
        });

        cardsWithEvidences = cards.map((card: any) => ({
          ...card,
          levelName: card.nodeName,
          evidences: evidencesMap.get(card.id) || []
        }));
      }

      // Helper function to build pagination response
      const buildPaginationResponse = (data: any[], totalResult: any[]) => {
        const total = parseInt(totalResult[0]?.total || '0', 10);
        const totalPages = Math.ceil(total / limit);
        const hasMore = page < totalPages;
        return {
          data,
          total,
          page,
          limit,
          totalPages,
          hasMore
        };
      };

      return {
        cardTypes: buildPaginationResponse(cardTypes, cardTypesCount),
        priorities: buildPaginationResponse(priorities, prioritiesCount),
        preclassifiers: buildPaginationResponse(preclassifiers, preclassifiersCount),
        levels: buildPaginationResponse(levels, levelsCount),
        employees: buildPaginationResponse(employees, employeesCount),
        cards: buildPaginationResponse(cardsWithEvidences, cardsCount)
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
