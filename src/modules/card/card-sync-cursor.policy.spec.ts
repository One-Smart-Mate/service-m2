import { BadRequestException } from '@nestjs/common';
import { CardSyncCursorPolicy } from './card-sync-cursor.policy';

describe('CardSyncCursorPolicy', () => {
  it('uses the beginning of time when no cursor is provided', () => {
    expect(CardSyncCursorPolicy.decode()).toEqual({
      revision: '0',
      id: '0',
    });
  });

  it('round-trips an opaque cursor without losing a bigint id', () => {
    const value = {
      revision: '18446744073709551615',
      id: '18446744073709551615',
    };

    expect(
      CardSyncCursorPolicy.decode(CardSyncCursorPolicy.encode(value, 25), 25),
    ).toEqual(value);
  });

  it.each([
    'not+a+base64url+cursor',
    Buffer.from('{}').toString('base64url'),
    Buffer.from(
      JSON.stringify({
        version: 1,
        changedAt: 'not-a-date',
        id: '1',
      }),
    ).toString('base64url'),
    Buffer.from(
      JSON.stringify({
        version: 1,
        changedAt: '2026-09-24T12:00:00.000Z',
        id: '-1',
      }),
    ).toString('base64url'),
  ])('rejects a malformed or unsupported cursor', (cursor) => {
    expect(() => CardSyncCursorPolicy.decode(cursor)).toThrow(
      BadRequestException,
    );
  });

  it('forces a complete resync for the imprecise legacy cursor', () => {
    const legacy = Buffer.from(
      JSON.stringify({
        version: 1,
        changedAt: '2026-09-24T12:34:56.789Z',
        id: '9',
      }),
    ).toString('base64url');
    expect(CardSyncCursorPolicy.decode(legacy, 25)).toEqual({
      revision: '0',
      id: '0',
    });
  });
  it('rejects a cursor issued for another site', () => {
    const cursor = CardSyncCursorPolicy.encode({ revision: '20', id: '9' }, 25);
    expect(() => CardSyncCursorPolicy.decode(cursor, 26)).toThrow(
      BadRequestException,
    );
  });

  it('normalizes the default limit and accepts the maximum', () => {
    expect(CardSyncCursorPolicy.normalizeLimit()).toBe(200);
    expect(CardSyncCursorPolicy.normalizeLimit(500)).toBe(500);
  });

  it.each([0, -1, 1.5, 501, Number.NaN])(
    'rejects an invalid page limit',
    (limit) => {
      expect(() => CardSyncCursorPolicy.normalizeLimit(limit)).toThrow(
        BadRequestException,
      );
    },
  );
});
