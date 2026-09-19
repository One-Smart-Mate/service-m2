import { Repository } from 'typeorm';
import { AuthSessionService } from './auth-session.service';
import { AuthSessionEntity } from './entities/auth-session.entity';

describe('AuthSessionService', () => {
  const manager = {
    findOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };
  const repository = {
    manager: {
      transaction: jest.fn((callback) => callback(manager)),
    },
  } as unknown as Repository<AuthSessionEntity>;
  const service = new AuthSessionService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a fast session only below an active primary session', async () => {
    manager.findOne.mockResolvedValue({
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
    manager.findOne.mockResolvedValue({
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
      ),
    ).resolves.toBe(false);
    expect(manager.insert).not.toHaveBeenCalled();
  });
});
