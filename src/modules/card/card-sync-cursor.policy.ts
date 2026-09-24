import { BadRequestException } from '@nestjs/common';

export interface CardSyncCursor {
  changedAt: Date;
  id: string;
}

interface SerializedCardSyncCursor {
  version: 1;
  changedAt: string;
  id: string;
}

export class CardSyncCursorPolicy {
  static readonly DEFAULT_LIMIT = 200;
  static readonly MAX_LIMIT = 500;
  private static readonly INITIAL_DATE = new Date(0);

  static decode(cursor?: string): CardSyncCursor {
    if (!cursor) {
      return {
        changedAt: this.INITIAL_DATE,
        id: '0',
      };
    }

    if (cursor.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(cursor)) {
      throw new BadRequestException('Invalid card sync cursor');
    }

    try {
      const payload = JSON.parse(
        Buffer.from(cursor, 'base64url').toString('utf8'),
      ) as Partial<SerializedCardSyncCursor>;
      const changedAt = new Date(payload.changedAt);

      if (
        payload.version !== 1 ||
        Number.isNaN(changedAt.getTime()) ||
        typeof payload.id !== 'string' ||
        !/^\d+$/.test(payload.id)
      ) {
        throw new Error('Invalid cursor payload');
      }

      BigInt(payload.id);
      return { changedAt, id: payload.id };
    } catch {
      throw new BadRequestException('Invalid card sync cursor');
    }
  }

  static encode(cursor: CardSyncCursor): string {
    const payload: SerializedCardSyncCursor = {
      version: 1,
      changedAt: cursor.changedAt.toISOString(),
      id: cursor.id,
    };

    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  }

  static normalizeLimit(limit?: number): number {
    if (limit === undefined) {
      return this.DEFAULT_LIMIT;
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > this.MAX_LIMIT) {
      throw new BadRequestException(
        `limit must be an integer between 1 and ${this.MAX_LIMIT}`,
      );
    }

    return limit;
  }
}
