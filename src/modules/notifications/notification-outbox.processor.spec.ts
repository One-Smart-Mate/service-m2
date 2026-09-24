import { DataSource, EntityManager, Repository } from 'typeorm';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import {
  NotificationOutboxEntity,
  NotificationOutboxStatus,
} from './entities/notification-outbox.entity';
import { NotificationOutboxProcessor } from './notification-outbox.processor';

describe('NotificationOutboxProcessor', () => {
  const event = {
    id: 11,
    status: NotificationOutboxStatus.PENDING,
    attempts: 0,
    payload: {
      audience: { type: 'site-except-user', siteId: 2, excludedUserId: 7 },
      notification: {
        title: 'Card',
        description: 'Created',
        type: 'CARD',
      },
    },
  } as NotificationOutboxEntity;
  const queryBuilder = {
    setLock: jest.fn().mockReturnThis(),
    setOnLocked: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };
  const manager = {
    createQueryBuilder: jest.fn(() => queryBuilder),
    save: jest.fn((_entity, value) => Promise.resolve(value)),
  } as unknown as EntityManager;
  const repository = {
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  } as unknown as Repository<NotificationOutboxEntity>;
  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
    getRepository: jest.fn(() => repository),
  } as unknown as DataSource;
  const usersService = {
    getSiteUsersTokensExcludingOwnerUser: jest.fn(),
  } as unknown as UsersService;
  const firebaseService = {
    sendMultipleMessage: jest.fn(),
  } as unknown as FirebaseService;
  const processor = new NotificationOutboxProcessor(
    dataSource,
    usersService,
    firebaseService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(manager.createQueryBuilder).mockReturnValue(queryBuilder as never);
    jest
      .mocked(manager.save)
      .mockImplementation((_entity, value) => Promise.resolve(value as never));
  });

  it('claims with a row lock, sends once and marks the event as sent', async () => {
    queryBuilder.getOne
      .mockResolvedValueOnce({ ...event })
      .mockResolvedValueOnce(null);
    jest
      .mocked(usersService.getSiteUsersTokensExcludingOwnerUser)
      .mockResolvedValue([
        { token: 'device-token', type: 'ANDROID' },
        { token: 'device-token', type: 'ANDROID' },
      ]);
    jest.mocked(firebaseService.sendMultipleMessage).mockResolvedValue(true);

    await processor.processPending();

    expect(queryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(queryBuilder.setOnLocked).toHaveBeenCalledWith('skip_locked');
    expect(
      usersService.getSiteUsersTokensExcludingOwnerUser,
    ).toHaveBeenCalledWith(2, 7);
    expect(firebaseService.sendMultipleMessage).toHaveBeenCalledWith(
      expect.objectContaining({ notification_id: '11' }),
      [{ token: 'device-token', type: 'ANDROID' }],
    );
    expect(repository.update).toHaveBeenCalledWith(
      { id: 11, status: NotificationOutboxStatus.PROCESSING },
      expect.objectContaining({ status: NotificationOutboxStatus.SENT }),
    );
  });

  it('backs off a failed delivery instead of losing the event', async () => {
    queryBuilder.getOne
      .mockResolvedValueOnce({ ...event, attempts: 1 })
      .mockResolvedValueOnce(null);
    jest
      .mocked(usersService.getSiteUsersTokensExcludingOwnerUser)
      .mockResolvedValue([{ token: 'device-token', type: 'ANDROID' }]);
    jest.mocked(firebaseService.sendMultipleMessage).mockResolvedValue(false);

    await processor.processPending();

    expect(repository.update).toHaveBeenCalledWith(
      { id: 11, status: NotificationOutboxStatus.PROCESSING },
      expect.objectContaining({
        status: NotificationOutboxStatus.FAILED,
        lockedAt: null,
        lastError: 'Notification dispatch failed',
      }),
    );
  });
});
