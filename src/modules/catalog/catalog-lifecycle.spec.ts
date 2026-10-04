import { applyCatalogLifecycle } from './catalog-lifecycle';

describe('applyCatalogLifecycle', () => {
  const changedAt = new Date('2026-09-24T12:00:00.000Z');

  it('clears the deletion marker when a catalog is reactivated', () => {
    const catalog = {
      status: 'I',
      updatedAt: new Date(0),
      deletedAt: new Date('2026-09-20T12:00:00.000Z'),
    };

    expect(applyCatalogLifecycle(catalog, 'A', changedAt)).toEqual({
      status: 'A',
      updatedAt: changedAt,
      deletedAt: null,
    });
  });

  it('marks an inactive catalog as deleted at the same revision time', () => {
    const catalog = {
      status: 'A',
      updatedAt: new Date(0),
      deletedAt: null,
    };

    expect(applyCatalogLifecycle(catalog, 'I', changedAt)).toEqual({
      status: 'I',
      updatedAt: changedAt,
      deletedAt: changedAt,
    });
  });
});
