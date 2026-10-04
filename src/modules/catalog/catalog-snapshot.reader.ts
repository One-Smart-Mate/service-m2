import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

export interface CatalogSnapshot {
  schemaVersion: 1;
  siteId: number;
  generatedAt: string;
  revision: string | null;
  cardTypes: Record<string, unknown>[];
  priorities: Record<string, unknown>[];
  preclassifiers: Record<string, unknown>[];
  levels: Record<string, unknown>[];
}

@Injectable()
export class CatalogSnapshotReader {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  read(siteId: number): Promise<CatalogSnapshot> {
    return this.dataSource.transaction(
      'REPEATABLE READ',
      async (manager) => {
        await this.assertActiveSite(manager, siteId);

        const cardTypes = await manager.query(
          `
            SELECT
              ct.id,
              ct.site_id AS siteId,
              ct.cardType_methodology AS cardTypeMethodology,
              ct.cardType_methodology_name AS methodology,
              ct.cardType_name AS name,
              ct.cardType_description AS description,
              ct.color,
              ct.responsable_id AS responsableId,
              ct.responsable_name AS responsableName,
              ct.quantity_pictures_create AS quantityPicturesCreate,
              ct.quantity_audios_create AS quantityAudiosCreate,
              ct.quantity_videos_create AS quantityVideosCreate,
              ct.audios_duration_create AS audiosDurationCreate,
              ct.videos_duration_create AS videosDurationCreate,
              ct.quantity_pictures_close AS quantityPicturesClose,
              ct.quantity_audios_close AS quantityAudiosClose,
              ct.quantity_videos_close AS quantityVideosClose,
              ct.audios_duration_close AS audiosDurationClose,
              ct.videos_duration_close AS videosDurationClose,
              ct.quantity_pictures_ps AS quantityPicturesPs,
              ct.quantity_audios_ps AS quantityAudiosPs,
              ct.quantity_videos_ps AS quantityVideosPs,
              ct.audios_duration_ps AS audiosDurationPs,
              ct.videos_duration_ps AS videosDurationPs
            FROM card_types ct
            WHERE ct.site_id = ?
              AND ct.status = 'A'
              AND ct.deleted_at IS NULL
            ORDER BY ct.id
          `,
          [siteId],
        );

        const priorities = await manager.query(
          `
            SELECT
              p.id,
              p.site_id AS siteId,
              p.priority_code AS priorityCode,
              p.priority_description AS priorityDescription,
              p.priority_days AS priorityDays,
              p.order
            FROM priorities p
            WHERE p.site_id = ?
              AND p.status = 'A'
              AND p.deleted_at IS NULL
            ORDER BY p.order, p.id
          `,
          [siteId],
        );

        const preclassifiers = await manager.query(
          `
            SELECT
              pc.id,
              pc.site_id AS siteId,
              pc.cardType_id AS cardTypeId,
              pc.preclassifier_code AS preclassifierCode,
              pc.preclassifier_description AS preclassifierDescription
            FROM preclassifiers pc
            INNER JOIN card_types ct
              ON ct.id = pc.cardType_id
              AND ct.site_id = pc.site_id
              AND ct.status = 'A'
              AND ct.deleted_at IS NULL
            WHERE pc.site_id = ?
              AND pc.status = 'A'
              AND pc.deleted_at IS NULL
            ORDER BY pc.cardType_id, pc.id
          `,
          [siteId],
        );

        const levels = await manager.query(
          `
            SELECT
              l.id,
              l.site_id AS siteId,
              l.level_name AS name,
              l.level_description AS description,
              l.level,
              l.level_machine_id AS levelMachineId,
              l.superior_id AS superiorId,
              l.responsable_id AS responsibleId,
              l.responsable_name AS responsibleName,
              l.notify,
              l.assign_when_creating AS assignWhileCreate
            FROM levels l
            WHERE l.site_id = ?
              AND l.status = 'A'
              AND l.deleted_at IS NULL
            ORDER BY l.level, l.id
          `,
          [siteId],
        );

        const revisionResult = await manager.query(
          `
            SELECT MAX(changed_at) AS revision
            FROM (
              SELECT GREATEST(
                COALESCE(created_at, '1970-01-01 00:00:00'),
                COALESCE(updated_at, '1970-01-01 00:00:00'),
                COALESCE(deleted_at, '1970-01-01 00:00:00')
              ) AS changed_at
              FROM card_types WHERE site_id = ?
              UNION ALL
              SELECT GREATEST(
                COALESCE(created_at, '1970-01-01 00:00:00'),
                COALESCE(updated_at, '1970-01-01 00:00:00'),
                COALESCE(deleted_at, '1970-01-01 00:00:00')
              ) FROM priorities WHERE site_id = ?
              UNION ALL
              SELECT GREATEST(
                COALESCE(created_at, '1970-01-01 00:00:00'),
                COALESCE(updated_at, '1970-01-01 00:00:00'),
                COALESCE(deleted_at, '1970-01-01 00:00:00')
              ) FROM preclassifiers WHERE site_id = ?
              UNION ALL
              SELECT GREATEST(
                COALESCE(created_at, '1970-01-01 00:00:00'),
                COALESCE(updated_at, '1970-01-01 00:00:00'),
                COALESCE(deleted_at, '1970-01-01 00:00:00')
              ) FROM levels WHERE site_id = ?
            ) catalog_changes
          `,
          [siteId, siteId, siteId, siteId],
        );

        return {
          schemaVersion: 1,
          siteId,
          generatedAt: new Date().toISOString(),
          revision: this.normalizeRevision(revisionResult[0]?.revision),
          cardTypes,
          priorities,
          preclassifiers,
          levels,
        };
      },
    );
  }

  private async assertActiveSite(
    manager: EntityManager,
    siteId: number,
  ): Promise<void> {
    const sites = await manager.query(
      `
        SELECT id
        FROM sites
        WHERE id = ? AND status = 'A' AND deleted_at IS NULL
        LIMIT 1
      `,
      [siteId],
    );
    if (sites.length === 0) {
      throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
    }
  }

  private normalizeRevision(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const revision = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(revision.getTime())
      ? String(value)
      : revision.toISOString();
  }
}
