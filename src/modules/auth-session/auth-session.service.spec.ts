import { Repository } from 'typeorm';
import { AuthSessionService } from './auth-session.service';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { UserEntity } from '../users/entities/user.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { UserHasSitesEntity } from '../users/entities/user.has.sites.entity';

describe('AuthSessionService', () => {
  const manager = {
    findOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };
  const repository = {
    manager: {
      connection: {
        transaction: jest.fn((_isolation, callback) => callback(manager)),
      },
    },
  } as unknown as Repository<AuthSessionEntity>;
  const service = new AuthSessionService(repository);

  const mockSessionLookups = (parent: Partial<AuthSessionEntity>) => {
    manager.findOne.mockImplementation((entity, options) => {
      if (entity === UserEntity) {
        return Promise.resolve({
          id: options.where.id,
          status: 'A',
          fastPasswordDigest: 'verified-digest',
        });
      }
      if (entity === SiteEntity) return Promise.resolve({ id: 1, status: 'A' });
      if (entity === UserHasSitesEntity)
        return Promise.resolve({ status: 'A' });
      return Promise.resolve(parent);
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retries only a session transaction explicitly aborted by MySQL', async () => {
    const transaction = repository.manager.connection.transaction as jest.Mock;
    transaction.mockRejectedValueOnce({ driverError: { code: 'ER_LOCK_DEADLOCK' } });
    manager.update.mockResolvedValue({ affected: 1 });
    await expect(service.revokeSession('fixture-session', 7)).resolves.toBe(true);
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(transaction).toHaveBeenCalledWith('READ COMMITTED', expect.any(Function));
  });

  it('creates a fast session only below an active primary session', async () => {
    mockSessionLookups({
      id: 'primary-id',
      userId: 7,
      sessionType: 'primary',
      revokedAt: null,
    });

    await expect(
      service.createChildSession(
        {
          id: 'fast-id',
          userId: 8,
          actorId: 7,
          sessionType: 'fast',
          platform: 'ANDROID',
        },
        'primary-id',
        7,
        { type: 'fastPassword', value: 'verified-digest', siteId: 1 },
      ),
    ).resolves.toBe(true);
    expect(manager.insert).toHaveBeenCalledWith(
      AuthSessionEntity,
      expect.objectContaining({
        id: 'fast-id',
        parentSessionId: 'primary-id',
        actorId: 7,
      }),
    );
  });

  it('does not allow nested fast-password sessions', async () => {
    mockSessionLookups({
      id: 'fast-parent',
      userId: 8,
      sessionType: 'fast',
      revokedAt: null,
    });

    await expect(
      service.createChildSession(
        {
          id: 'nested-fast-id',
          userId: 9,
          actorId: 8,
          sessionType: 'fast',
          platform: 'ANDROID',
        },
        'fast-parent',
        8,
        { type: 'fastPassword', value: 'verified-digest', siteId: 1 },
      ),
    ).resolves.toBe(false);
    expect(manager.insert).not.toHaveBeenCalled();
  });
  it('does not rotate a session after site access is removed', async () => {
    mockSessionLookups({});
    manager.findOne.mockImplementation((entity) =>
      Promise.resolve(entity === UserEntity ? { id: 7, status: 'A' } : null),
    );
    await expect(
      service.rotateSession(
        'primary-id',
        7,
        {
          id: 'replacement',
          userId: 7,
          sessionType: 'primary',
          platform: 'ANDROID',
        },
        1,
      ),
    ).resolves.toBe(false);
    expect(manager.update).not.toHaveBeenCalled();
    expect(manager.insert).not.toHaveBeenCalled();
  });
});
