import { OplAccessPersistence } from './opl-access.persistence';

describe('OPL atomic access counters', () => {
  it('upserts and increments both counters in the same transaction on every access', async () => {
    const builder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({}),
    };
    const manager = {
      findOne: jest.fn().mockResolvedValue({ id: 11, siteId: 7 }),
      query: jest.fn().mockResolvedValue({}),
      createQueryBuilder: jest.fn(() => builder),
    };
    const transaction = jest.fn((fn) => fn(manager));
    const service = new OplAccessPersistence({ transaction } as never);
    await Promise.all(Array.from({ length: 10 }, () => service.record(1, 11)));
    expect(transaction).toHaveBeenCalledTimes(10);
    expect(manager.query).toHaveBeenCalledTimes(10);
    expect(builder.execute).toHaveBeenCalledTimes(10);
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining(
        'ON DUPLICATE KEY UPDATE access_count = access_count + 1',
      ),
      [1, 11, 7, expect.any(Date), expect.any(Date)],
    );
    expect(manager.findOne).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
    expect(builder.set.mock.calls[0][0].directUsageCount()).toBe(
      'COALESCE(direct_usage_count, 0) + 1',
    );
  });
  it('propagates the second counter failure so TypeORM rolls back the upsert', async () => {
    const builder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockRejectedValue(new Error('counter failed')),
    };
    const manager = {
      findOne: jest.fn().mockResolvedValue({ id: 11, siteId: 7 }),
      query: jest.fn().mockResolvedValue({}),
      createQueryBuilder: () => builder,
    };
    const service = new OplAccessPersistence({
      transaction: (fn) => fn(manager),
    } as never);
    await expect(service.record(1, 11)).rejects.toThrow('counter failed');
  });
});
