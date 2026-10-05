import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull } from 'typeorm';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { stringConstants } from 'src/utils/string.constant';
import { EvidenceEntity } from '../evidence/entities/evidence.entity';
import { CardSyncCursorPolicy } from './card-sync-cursor.policy';
import { CardEntity } from './entities/card.entity';

interface CardChangeRow {
  id: number | string;
  changedAt: Date | string;
  revision: string;
  cardUUID: string;
  deletedAt: Date | string | null;
}

export interface CardDeltaUpsert {
  type: 'upsert';
  changedAt: string;
  card: CardEntity & {
    levelName: string;
    evidences: EvidenceEntity[];
  };
}

export interface CardDeltaDelete {
  type: 'delete';
  id: number;
  cardUUID: string;
  siteId: number;
  deletedAt: string;
  changedAt: string;
}

export type CardDeltaChange = CardDeltaUpsert | CardDeltaDelete;

export interface CardDeltaSyncResponse {
  schemaVersion: 1;
  siteId: number;
  generatedAt: string;
  nextCursor: string;
  hasMore: boolean;
  changes: CardDeltaChange[];
}

@Injectable()
export class CardDeltaSyncReader {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  read(
    siteId: number,
    cursor?: string,
    requestedLimit?: number,
  ): Promise<CardDeltaSyncResponse> {
    const decodedCursor = CardSyncCursorPolicy.decode(cursor, siteId);
    const limit = CardSyncCursorPolicy.normalizeLimit(requestedLimit);

    return this.dataSource.transaction('REPEATABLE READ', async (manager) => {
      const syncUntil = await this.readSnapshotUpperBound(manager);
      await this.assertActiveSite(manager, siteId);
      const [clock] = await manager.query(
        'SELECT CAST(revision AS CHAR) AS revision FROM card_sync_clock WHERE site_id = ?',
        [siteId],
      );
      const rows = await this.readChangedCards(
        manager,
        siteId,
        decodedCursor.revision,
        decodedCursor.id,
        String(clock?.revision ?? '0'),
        limit + 1,
      );
      const hasMore = rows.length > limit;
      const pageRows = rows.slice(0, limit);
      const changes = await this.hydrateChanges(manager, siteId, pageRows);
      const nextCursor = this.createNextCursor(
        pageRows,
        hasMore,
        String(clock?.revision ?? '0'),
        siteId,
      );

      return {
        schemaVersion: 1,
        siteId,
        generatedAt: syncUntil.toISOString(),
        nextCursor,
        hasMore,
        changes,
      };
    });
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

  private async readSnapshotUpperBound(manager: EntityManager): Promise<Date> {
    const result = await manager.query('SELECT UTC_TIMESTAMP(6) AS syncUntil');
    return this.toDate(result[0]?.syncUntil, 'snapshot timestamp');
  }

  private readChangedCards(
    manager: EntityManager,
    siteId: number,
    revision: string,
    cursorId: string,
    upperRevision: string,
    limit: number,
  ): Promise<CardChangeRow[]> {
    return manager.query(
      `SELECT card_id AS id, CAST(revision AS CHAR) AS revision,
              changed_at AS changedAt, card_uuid AS cardUUID, deleted_at AS deletedAt
       FROM card_sync_changes
       WHERE site_id = ? AND revision <= CAST(? AS UNSIGNED)
         AND (revision > CAST(? AS UNSIGNED) OR (revision = CAST(? AS UNSIGNED) AND card_id > CAST(? AS UNSIGNED)))
       ORDER BY revision ASC, card_id ASC LIMIT ?`,
      [siteId, upperRevision, revision, revision, cursorId, limit],
    );
  }

  private async hydrateChanges(
    manager: EntityManager,
    siteId: number,
    rows: CardChangeRow[],
  ): Promise<CardDeltaChange[]> {
    if (rows.length === 0) {
      return [];
    }

    const ids = rows.map((row) => row.id as number);
    const cards = await manager.find(CardEntity, {
      where: { siteId, id: In(ids) },
    });
    const cardById = new Map(cards.map((card) => [String(card.id), card]));
    const activeCardIds = cards
      .filter((card) => !card.deletedAt)
      .map((card) => card.id);
    const evidences =
      activeCardIds.length === 0
        ? []
        : await manager.find(EvidenceEntity, {
            where: {
              cardId: In(activeCardIds),
              siteId,
              status: stringConstants.activeStatus,
              deletedAt: IsNull(),
            },
          });
    const evidenceByCardId = new Map<string, EvidenceEntity[]>();

    for (const evidence of evidences) {
      const cardId = String(evidence.cardId);
      const cardEvidences = evidenceByCardId.get(cardId) ?? [];
      cardEvidences.push(evidence);
      evidenceByCardId.set(cardId, cardEvidences);
    }

    return rows.map((row) => {
      const card = cardById.get(String(row.id));
      if (!card && !row.deletedAt)
        throw new Error('Card sync journal is inconsistent');

      const changedAt = this.toDate(row.changedAt, 'card change timestamp');
      if (row.deletedAt || card?.deletedAt) {
        return {
          type: 'delete',
          id: Number(row.id),
          cardUUID: row.cardUUID,
          siteId,
          deletedAt: this.toDate(
            row.deletedAt || card.deletedAt,
            'card deletion timestamp',
          ).toISOString(),
          changedAt: changedAt.toISOString(),
        };
      }

      return {
        type: 'upsert',
        changedAt: changedAt.toISOString(),
        card: Object.assign(card, {
          levelName: card.nodeName,
          evidences: evidenceByCardId.get(String(card.id)) ?? [],
        }),
      };
    });
  }

  private createNextCursor(
    rows: CardChangeRow[],
    hasMore: boolean,
    upperRevision: string,
    siteId: number,
  ): string {
    const last = rows[rows.length - 1];
    return CardSyncCursorPolicy.encode(
      hasMore
        ? { revision: String(last.revision), id: String(last.id) }
        : {
            revision: upperRevision,
            id:
              last && String(last.revision) === upperRevision
                ? String(last.id)
                : '0',
          },
      siteId,
    );
  }

  private toDate(value: unknown, description: string): Date {
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid ${description}`);
    }
    return date;
  }
}
