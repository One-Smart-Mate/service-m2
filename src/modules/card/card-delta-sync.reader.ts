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
    const decodedCursor = CardSyncCursorPolicy.decode(cursor);
    const limit = CardSyncCursorPolicy.normalizeLimit(requestedLimit);

    return this.dataSource.transaction(
      'REPEATABLE READ',
      async (manager) => {
        const syncUntil = await this.readSnapshotUpperBound(manager);
        await this.assertActiveSite(manager, siteId);
        const rows = await this.readChangedCards(
          manager,
          siteId,
          decodedCursor.changedAt,
          decodedCursor.id,
          syncUntil,
          limit + 1,
        );
        const hasMore = rows.length > limit;
        const pageRows = rows.slice(0, limit);
        const changes = await this.hydrateChanges(manager, siteId, pageRows);
        const nextCursor = this.createNextCursor(
          pageRows,
          hasMore,
          syncUntil,
        );

        return {
          schemaVersion: 1,
          siteId,
          generatedAt: syncUntil.toISOString(),
          nextCursor,
          hasMore,
          changes,
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

  private async readSnapshotUpperBound(
    manager: EntityManager,
  ): Promise<Date> {
    const result = await manager.query(
      'SELECT UTC_TIMESTAMP(6) AS syncUntil',
    );
    return this.toDate(result[0]?.syncUntil, 'snapshot timestamp');
  }

  private readChangedCards(
    manager: EntityManager,
    siteId: number,
    cursorDate: Date,
    cursorId: string,
    syncUntil: Date,
    limit: number,
  ): Promise<CardChangeRow[]> {
    return manager.query(
      `
        SELECT
          changes.id,
          MAX(changes.changedAt) AS changedAt
        FROM (
          SELECT c.id, c.sync_changed_at AS changedAt
          FROM cards c
          WHERE c.site_id = ?
            AND c.sync_changed_at <= ?
            AND (
              c.sync_changed_at > ?
              OR (c.sync_changed_at = ? AND c.id > ?)
            )
          UNION ALL
          SELECT e.card_id AS id, MAX(e.sync_changed_at) AS changedAt
          FROM evidences e
          WHERE e.site_id = ?
            AND e.sync_changed_at <= ?
            AND (
              e.sync_changed_at > ?
              OR (e.sync_changed_at = ? AND e.card_id > ?)
            )
          GROUP BY e.card_id
        ) changes
        GROUP BY changes.id
        ORDER BY changedAt ASC, changes.id ASC
        LIMIT ?
      `,
      [
        siteId,
        syncUntil,
        cursorDate,
        cursorDate,
        cursorId,
        siteId,
        syncUntil,
        cursorDate,
        cursorDate,
        cursorId,
        limit,
      ],
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
      if (!card) {
        throw new Error(`Card ${row.id} disappeared during delta snapshot`);
      }

      const changedAt = this.toDate(row.changedAt, 'card change timestamp');
      if (card.deletedAt) {
        return {
          type: 'delete',
          id: card.id,
          cardUUID: card.cardUUID,
          siteId: card.siteId,
          deletedAt: this.toDate(
            card.deletedAt,
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
    syncUntil: Date,
  ): string {
    if (rows.length === 0) {
      return CardSyncCursorPolicy.encode({ changedAt: syncUntil, id: '0' });
    }

    const lastRow = rows[rows.length - 1];
    const lastChangedAt = this.toDate(
      lastRow.changedAt,
      'card change timestamp',
    );
    if (!hasMore) {
      return CardSyncCursorPolicy.encode({
        changedAt: syncUntil,
        id:
          lastChangedAt.getTime() === syncUntil.getTime()
            ? String(lastRow.id)
            : '0',
      });
    }

    return CardSyncCursorPolicy.encode({
      changedAt: lastChangedAt,
      id: String(lastRow.id),
    });
  }

  private toDate(value: unknown, description: string): Date {
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid ${description}`);
    }
    return date;
  }
}
