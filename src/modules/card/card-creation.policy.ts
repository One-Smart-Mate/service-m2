import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { convertToISOFormat } from 'src/utils/general.functions';

export const CARD_PRIORITY_WILDCARD_CODE = 'XX';

export interface ResolveCardDatesInput {
  cardCreationDate: string;
  priorityCode: string;
  priorityDays: number;
  customDueDate?: string | null;
}

export interface ResolvedCardDates {
  cardCreationDate: string;
  createdAt: Date;
  cardDueDate: Date;
}

export interface ExistingOfflineCardIdentity {
  siteId: number;
  creatorId: number;
  nodeId: number | null;
  priorityId: number;
  cardTypeId: number;
  preclassifierId: number;
  cardCreationDate?: string | Date;
  cardTypeValue?: string | null;
  commentsAtCardCreation?: string | null;
  deletedAt?: Date | null;
}

export interface OfflineCardIdentity {
  siteId: number;
  creatorId: number;
  nodeId?: number | null;
  priorityId?: number;
  cardTypeId?: number;
  preclassifierId?: number;
  cardCreationDate?: string | Date;
  cardTypeValue?: string | null;
  comments?: string | null;
}

export class CardCreationPolicy {
  static assertIdempotentRetry(
    existingCard: ExistingOfflineCardIdentity,
    retry: OfflineCardIdentity,
  ): void {
    const numericFields: Array<
      keyof Pick<
        OfflineCardIdentity,
        | 'siteId'
        | 'creatorId'
        | 'nodeId'
        | 'priorityId'
        | 'cardTypeId'
        | 'preclassifierId'
      >
    > = [
      'siteId',
      'creatorId',
      'nodeId',
      'priorityId',
      'cardTypeId',
      'preclassifierId',
    ];
    const hasDifferentIdentity = numericFields.some(
      (field) =>
        retry[field] !== undefined &&
        Number(existingCard[field]) !== Number(retry[field]),
    );
    const hasDifferentClassification =
      retry.cardTypeValue !== undefined &&
      (existingCard.cardTypeValue ?? null) !== (retry.cardTypeValue ?? null);
    const hasDifferentComments =
      retry.comments !== undefined &&
      (existingCard.commentsAtCardCreation ?? null) !==
        (retry.comments ?? null);
    const hasDifferentCreationDate =
      retry.cardCreationDate !== undefined &&
      new Date(existingCard.cardCreationDate as string | Date).getTime() !==
        new Date(retry.cardCreationDate).getTime();

    if (
      existingCard.deletedAt ||
      hasDifferentIdentity ||
      hasDifferentCreationDate ||
      hasDifferentClassification ||
      hasDifferentComments
    ) {
      throw new ValidationException(
        ValidationExceptionType.DUPLICATE_CARD_UUID,
      );
    }
  }

  static resolveDates(input: ResolveCardDatesInput): ResolvedCardDates {
    const cardCreationDate = convertToISOFormat(input.cardCreationDate);
    const createdAt = new Date(cardCreationDate);
    if (Number.isNaN(createdAt.getTime())) {
      throw new ValidationException(ValidationExceptionType.INVALID_DATE);
    }
    if (!Number.isSafeInteger(input.priorityDays) || input.priorityDays < 0) {
      throw new ValidationException(ValidationExceptionType.INVALID_DATE);
    }

    const creationDay = this.parseDateOnly(cardCreationDate.slice(0, 10));
    const customDueDate = input.customDueDate?.trim();
    let cardDueDate: Date;

    const priorityCode = input.priorityCode?.trim().toUpperCase();
    if (priorityCode === CARD_PRIORITY_WILDCARD_CODE) {
      if (!customDueDate) {
        throw new ValidationException(
          ValidationExceptionType.CUSTOM_DUE_DATE_REQUIRED,
        );
      }
      cardDueDate = this.parseDateOnly(customDueDate);
      if (cardDueDate.getTime() < creationDay.getTime()) {
        throw new ValidationException(ValidationExceptionType.INVALID_DATE);
      }
    } else {
      if (customDueDate) {
        throw new ValidationException(
          ValidationExceptionType.CUSTOM_DUE_DATE_NOT_ALLOWED,
        );
      }
      cardDueDate = new Date(creationDay);
      cardDueDate.setDate(cardDueDate.getDate() + input.priorityDays);
    }

    return { cardCreationDate, createdAt, cardDueDate };
  }

  private static parseDateOnly(value: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      throw new ValidationException(ValidationExceptionType.INVALID_DATE);
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new ValidationException(ValidationExceptionType.INVALID_DATE);
    }
    return date;
  }
}
