import { DataSource, EntityManager } from 'typeorm';
import { NotFoundCustomException } from 'src/common/exceptions/types/notFound.exception';
import { EvidenceEntity } from '../evidence/entities/evidence.entity';
import { CardDeltaSyncReader } from './card-delta-sync.reader';
import { CardSyncCursorPolicy } from './card-sync-cursor.policy';
import { CardEntity } from './entities/card.entity';

describe('CardDeltaSyncReader', () => {
  const manager = {
    query: jest.fn(),
    find: jest.fn(),
  } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn((_isolation, callback) => callback(manager)),
  } as unknown as DataSource;
  const reader = new CardDeltaSyncReader(dataSource);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns stable upserts and tombstones from one repeatable snapshot', async () => {
    const syncUntil = new Date('2026-09-24T12:00:00.000Z');
    const firstChange = new Date('2026-09-24T11:00:00.000Z');
    const secondChange = new Date('2026-09-24T11:30:00.000Z');
    jest
      .mocked(manager.query)
      .mockResolvedValueOnce([{ syncUntil }])
      .mockResolvedValueOnce([{ id: 25 }])
      .mockResolvedValueOnce([
        { id: '1', changedAt: firstChange },
        { id: '2', changedAt: secondChange },
        { id: '3', changedAt: new Date('2026-09-24T11:45:00.000Z') },
      ]);
    jest
      .mocked(manager.find)
      .mockResolvedValueOnce([
        {
          id: 1,
          siteId: 25,
          cardUUID: 'active-card',
          nodeName: 'Machine',
          deletedAt: null,
        } as CardEntity,
        {
          id: 2,
          siteId: 25,
          cardUUID: 'deleted-card',
          deletedAt: new Date('2026-09-24T11:29:00.000Z'),
        } as CardEntity,
      ])
      .mockResolvedValueOnce([
        {
          id: 90,
          cardId: 1,
          siteId: 25,
          status: 'A',
          deletedAt: null,
        } as EvidenceEntity,
      ]);

    const result = await reader.read(25, undefined, 2);

    expect(dataSource.transaction).toHaveBeenCalledWith(
      'REPEATABLE READ',
      expect.any(Function),
    );
    expect(result).toEqual({
      schemaVersion: 1,
      siteId: 25,
      generatedAt: syncUntil.toISOString(),
      nextCursor: expect.any(String),
      hasMore: true,
      changes: [
        {
          type: 'upsert',
          changedAt: firstChange.toISOString(),
          card: expect.objectContaining({
            id: 1,
            levelName: 'Machine',
            evidences: [expect.objectContaining({ id: 90 })],
          }),
        },
        {
          type: 'delete',
          id: 2,
          cardUUID: 'deleted-card',
          siteId: 25,
          deletedAt: '2026-09-24T11:29:00.000Z',
          changedAt: secondChange.toISOString(),
        },
      ],
    });
    expect(CardSyncCursorPolicy.decode(result.nextCursor)).toEqual({
      changedAt: secondChange,
      id: '2',
    });

    const deltaCall = jest.mocked(manager.query).mock.calls[2];
    expect(String(deltaCall[0])).toContain('c.sync_changed_at');
    expect(String(deltaCall[0])).toContain('e.sync_changed_at');
    expect(String(deltaCall[0])).toContain('UNION ALL');
    expect(String(deltaCall[0])).toContain(
      'ORDER BY changedAt ASC, changes.id ASC',
    );
    expect(deltaCall[1]).toEqual([
      25,
      syncUntil,
      new Date(0),
      new Date(0),
      '0',
      25,
      syncUntil,
      new Date(0),
      new Date(0),
      '0',
      3,
    ]);
    expect(manager.find).toHaveBeenNthCalledWith(
      2,
      EvidenceEntity,
      expect.objectContaining({
        where: expect.objectContaining({
          siteId: 25,
          status: 'A',
          deletedAt: expect.objectContaining({ _type: 'isNull' }),
        }),
      }),
    );
  });

  it('advances an empty final page to its database upper bound', async () => {
    const syncUntil = new Date('2026-09-24T12:00:00.000Z');
    jest
      .mocked(manager.query)
      .mockResolvedValueOnce([{ syncUntil }])
      .mockResolvedValueOnce([{ id: 25 }])
      .mockResolvedValueOnce([]);

    const result = await reader.read(25);

    expect(result.changes).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(CardSyncCursorPolicy.decode(result.nextCursor)).toEqual({
      changedAt: syncUntil,
      id: '0',
    });
    expect(manager.find).not.toHaveBeenCalled();
  });

  it('keeps the last id when the final change shares the upper bound', async () => {
    const syncUntil = new Date('2026-09-24T12:00:00.000Z');
    jest
      .mocked(manager.query)
      .mockResolvedValueOnce([{ syncUntil }])
      .mockResolvedValueOnce([{ id: 25 }])
      .mockResolvedValueOnce([{ id: '9', changedAt: syncUntil }]);
    jest.mocked(manager.find).mockResolvedValueOnce([
      {
        id: 9,
        siteId: 25,
        cardUUID: 'card-at-boundary',
        nodeName: 'Machine',
        deletedAt: null,
      } as CardEntity,
    ]).mockResolvedValueOnce([]);

    const result = await reader.read(25);

    expect(CardSyncCursorPolicy.decode(result.nextCursor)).toEqual({
      changedAt: syncUntil,
      id: '9',
    });
  });

  it('does not return deltas for an inactive or deleted site', async () => {
    jest
      .mocked(manager.query)
      .mockResolvedValueOnce([
        { syncUntil: new Date('2026-09-24T12:00:00.000Z') },
      ])
      .mockResolvedValueOnce([]);

    await expect(reader.read(25)).rejects.toBeInstanceOf(
      NotFoundCustomException,
    );
    expect(manager.query).toHaveBeenCalledTimes(2);
  });

  it('propagates a delta read failure instead of returning a partial page', async () => {
    jest
      .mocked(manager.query)
      .mockResolvedValueOnce([
        { syncUntil: new Date('2026-09-24T12:00:00.000Z') },
      ])
      .mockResolvedValueOnce([{ id: 25 }])
      .mockRejectedValueOnce(new Error('delta read failed'));

    await expect(reader.read(25)).rejects.toThrow('delta read failed');
  });
});
