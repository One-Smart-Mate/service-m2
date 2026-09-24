import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, DeepPartial, EntityManager } from 'typeorm';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { EvidenceEntity } from '../evidence/entities/evidence.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { CardEntity } from './entities/card.entity';
import { CardCreationPolicy } from './card-creation.policy';
import {
  NotificationOutboxEntity,
  NotificationOutboxPayload,
  NotificationOutboxStatus,
} from '../notifications/entities/notification-outbox.entity';

export interface CardEvidenceToPersist {
  type: string;
  url: string;
}

export interface PersistCardCreation {
  card: DeepPartial<CardEntity>;
  siteId: number;
  creatorId: number;
  cardUUID: string;
  createdAt: Date;
  evidences: CardEvidenceToPersist[];
  notifications?: Array<{
    deduplicationKey: string;
    payload: NotificationOutboxPayload;
  }>;
}

export interface PersistedCardCreation {
  card: CardEntity;
  created: boolean;
}

@Injectable()
export class CardCreationPersistence {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  persist = async (
    input: PersistCardCreation,
  ): Promise<PersistedCardCreation> => {
    try {
      return await this.dataSource.transaction(async (manager) => {
        await this.lockSite(manager, input.siteId);

        const existingCard = await manager.findOne(CardEntity, {
          where: { cardUUID: input.cardUUID },
        });
        if (existingCard) {
          return this.asIdempotentResult(existingCard, input);
        }

        const lastSiteCard = await manager.findOne(CardEntity, {
          where: { siteId: input.siteId },
          order: { siteCardId: 'DESC' },
        });
        const card = manager.create(CardEntity, {
          ...input.card,
          siteCardId: lastSiteCard ? lastSiteCard.siteCardId + 1 : 1,
        });
        const savedCard = await manager.save(CardEntity, card);

        if (input.evidences.length > 0) {
          const evidences = input.evidences.map((evidence) =>
            manager.create(EvidenceEntity, {
              evidenceName: evidence.url,
              evidenceType: evidence.type,
              cardId: savedCard.id,
              siteId: input.siteId,
              createdAt: input.createdAt,
            }),
          );
          await manager.save(EvidenceEntity, evidences);
        }

        if (input.notifications?.length) {
          const notifications = input.notifications.map((notification) =>
            manager.create(NotificationOutboxEntity, {
              ...notification,
              status: NotificationOutboxStatus.PENDING,
              attempts: 0,
              availableAt: input.createdAt,
              lockedAt: null,
              sentAt: null,
              lastError: null,
              createdAt: input.createdAt,
              updatedAt: input.createdAt,
            }),
          );
          await manager.save(NotificationOutboxEntity, notifications);
        }

        return { card: savedCard, created: true };
      });
    } catch (error) {
      if (!this.isDuplicateEntry(error)) {
        throw error;
      }

      const existingCard = await this.dataSource
        .getRepository(CardEntity)
        .findOneBy({ cardUUID: input.cardUUID });
      if (existingCard) {
        return this.asIdempotentResult(existingCard, input);
      }

      throw new ValidationException(
        ValidationExceptionType.DUPLICATE_RECORD,
      );
    }
  };

  private async lockSite(
    manager: EntityManager,
    siteId: number,
  ): Promise<void> {
    const site = await manager.findOne(SiteEntity, {
      where: { id: siteId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!site) {
      throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
    }
  }

  private asIdempotentResult(
    existingCard: CardEntity,
    input: Pick<PersistCardCreation, 'siteId' | 'creatorId' | 'card'>,
  ): PersistedCardCreation {
    CardCreationPolicy.assertIdempotentRetry(existingCard, {
      siteId: input.siteId,
      creatorId: input.creatorId,
      nodeId: input.card.nodeId,
      priorityId: input.card.priorityId,
      cardTypeId: input.card.cardTypeId,
      preclassifierId: input.card.preclassifierId,
      cardCreationDate: input.card.cardCreationDate,
      cardTypeValue: input.card.cardTypeValue,
      comments: input.card.commentsAtCardCreation,
    });

    return { card: existingCard, created: false };
  }

  private isDuplicateEntry(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ER_DUP_ENTRY'
    );
  }
}
