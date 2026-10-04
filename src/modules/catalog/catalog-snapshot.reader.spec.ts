import { DataSource, EntityManager } from 'typeorm';
import { NotFoundCustomException } from 'src/common/exceptions/types/notFound.exception';
import { CatalogSnapshotReader } from './catalog-snapshot.reader';

describe('CatalogSnapshotReader', () => {
  const manager = { query: jest.fn() } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn((_isolation, callback) => callback(manager)),
  } as unknown as DataSource;
  const reader = new CatalogSnapshotReader(dataSource);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads all active catalogs from one repeatable snapshot', async () => {
    const revision = new Date('2026-09-23T12:00:00.000Z');
    jest
      .mocked(manager.query)
      .mockResolvedValueOnce([{ id: 25 }])
      .mockResolvedValueOnce([{ id: 1, name: 'AM' }])
      .mockResolvedValueOnce([{ id: 2, priorityCode: 'P1' }])
      .mockResolvedValueOnce([{ id: 3, cardTypeId: 1 }])
      .mockResolvedValueOnce([{ id: 4, name: 'Machine' }])
      .mockResolvedValueOnce([{ revision }]);

    await expect(reader.read(25)).resolves.toEqual({
      schemaVersion: 1,
      siteId: 25,
      generatedAt: expect.any(String),
      revision: revision.toISOString(),
      cardTypes: [{ id: 1, name: 'AM' }],
      priorities: [{ id: 2, priorityCode: 'P1' }],
      preclassifiers: [{ id: 3, cardTypeId: 1 }],
      levels: [{ id: 4, name: 'Machine' }],
    });

    expect(dataSource.transaction).toHaveBeenCalledWith(
      'REPEATABLE READ',
      expect.any(Function),
    );
    expect(manager.query).toHaveBeenCalledTimes(6);

    const catalogSql = jest
      .mocked(manager.query)
      .mock.calls.slice(1, 5)
      .map(([sql]) => String(sql));
    for (const sql of catalogSql) {
      expect(sql).toContain("status = 'A'");
      expect(sql).toContain('deleted_at IS NULL');
    }
    expect(catalogSql.join(' ')).not.toContain('FROM cards');
    expect(catalogSql.join(' ')).not.toContain('FROM evidences');
  });

  it('does not return an inactive or deleted site snapshot', async () => {
    jest.mocked(manager.query).mockResolvedValueOnce([]);

    await expect(reader.read(25)).rejects.toBeInstanceOf(
      NotFoundCustomException,
    );
    expect(manager.query).toHaveBeenCalledTimes(1);
  });

  it('propagates a catalog read failure so no partial snapshot is returned', async () => {
    jest
      .mocked(manager.query)
      .mockResolvedValueOnce([{ id: 25 }])
      .mockResolvedValueOnce([{ id: 1 }])
      .mockRejectedValueOnce(new Error('priority read failed'));

    await expect(reader.read(25)).rejects.toThrow('priority read failed');
  });
});
