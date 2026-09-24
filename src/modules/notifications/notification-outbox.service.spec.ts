import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  NotificationOutboxEntity,
  NotificationOutboxStatus,
} from './entities/notification-outbox.entity';
import { NotificationOutboxService } from './notification-outbox.service';

describe('NotificationOutboxService', () => {
  const manager = {
    create: jest.fn((_entity, value) => value),
    save: jest.fn((_entity, value) => Promise.resolve({ id: 1, ...value })),
  } as unknown as EntityManager;
  const repository = {
    findOneByOrFail: jest.fn(),
  } as unknown as Repository<NotificationOutboxEntity>;
  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
    getRepository: jest.fn(() => repository),
  } as unknown as DataSource;
  const service = new NotificationOutboxService(dataSource);
  const input = {
    deduplicationKey: 'card-created:uuid:site',
    payload: {
      audience: {
        type: 'site-except-user' as const,
        siteId: 2,
        excludedUserId: 7,
      },
      notification: {
        title: 'Card',
        description: 'Created',
        type: 'CARD',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists a pending event before returning it to the caller', async () => {
    await service.enqueue(input);

    expect(manager.create).toHaveBeenCalledWith(
      NotificationOutboxEntity,
      expect.objectContaining({
        ...input,
        status: NotificationOutboxStatus.PENDING,
        attempts: 0,
      }),
    );
    expect(manager.save).toHaveBeenCalledWith(
      NotificationOutboxEntity,
      expect.any(Object),
    );
  });

  it('resolves a duplicate deduplication key as an idempotent retry', async () => {
    const existing = { id: 9, ...input } as NotificationOutboxEntity;
    jest
      .mocked(dataSource.transaction)
      .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
    jest.mocked(repository.findOneByOrFail).mockResolvedValue(existing);

    await expect(service.enqueue(input)).resolves.toBe(existing);
    expect(repository.findOneByOrFail).toHaveBeenCalledWith({
      deduplicationKey: input.deduplicationKey,
    });
  });
});
