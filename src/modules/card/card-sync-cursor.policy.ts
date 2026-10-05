import { BadRequestException } from '@nestjs/common';

export interface CardSyncCursor {
  revision: string;
  id: string;
}

/** Opaque, site-bound committed revision; v1 clients receive a full resync. */
export class CardSyncCursorPolicy {
  static readonly DEFAULT_LIMIT = 200;
  static readonly MAX_LIMIT = 500;
  static readonly MAX_DATABASE_ID = '18446744073709551615';

  static decode(cursor?: string, siteId?: number): CardSyncCursor {
    if (!cursor) return { revision: '0', id: '0' };
    if (cursor.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(cursor))
      throw new BadRequestException('Invalid card sync cursor');
    try {
      const payload = JSON.parse(
        Buffer.from(cursor, 'base64url').toString('utf8'),
      );
      if (
        payload.version === 1 &&
        typeof payload.changedAt === 'string' &&
        Number.isFinite(Date.parse(payload.changedAt)) &&
        typeof payload.id === 'string' &&
        /^\d{1,20}$/.test(payload.id)
      )
        return { revision: '0', id: '0' };
      if (
        payload.version !== 2 ||
        payload.siteId !== siteId ||
        typeof payload.revision !== 'string' ||
        typeof payload.id !== 'string' ||
        !/^\d{1,20}$/.test(payload.revision) ||
        !/^\d{1,20}$/.test(payload.id) ||
        BigInt(payload.revision) > 18446744073709551615n ||
        BigInt(payload.id) > 18446744073709551615n
      )
        throw new Error('Invalid cursor');
      return { revision: payload.revision, id: payload.id };
    } catch {
      throw new BadRequestException('Invalid card sync cursor');
    }
  }

  static encode(cursor: CardSyncCursor, siteId: number): string {
    return Buffer.from(
      JSON.stringify({ version: 2, siteId, ...cursor }),
      'utf8',
    ).toString('base64url');
  }

  static normalizeLimit(limit?: number): number {
    if (limit === undefined) return this.DEFAULT_LIMIT;
    if (!Number.isInteger(limit) || limit < 1 || limit > this.MAX_LIMIT)
      throw new BadRequestException(
        `limit must be an integer between 1 and ${this.MAX_LIMIT}`,
      );
    return limit;
  }
}
