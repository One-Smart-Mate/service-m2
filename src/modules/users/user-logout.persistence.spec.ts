import { UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthSessionEntity } from '../auth-session/entities/auth-session.entity';
import { PRIMARY_SESSION } from '../auth/models/auth-token.payload';
import { UserEntity } from './entities/user.entity';
import { UserLogoutPersistence } from './user-logout.persistence';

describe('UserLogoutPersistence', () => {
  const manager = {
    findOne: jest.fn(),
    save: jest.fn((entity, value) => Promise.resolve(value)),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
  } as unknown as DataSource;
  const persistence = new UserLogoutPersistence(dataSource);
  const loggedOutAt = new Date('2026-09-19T14:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears the session platform token and revokes child Fast Password sessions', async () => {
    const user = {
      id: 7,
      androidToken: 'android-token',
      iosToken: 'ios-token',
    } as UserEntity;
    const session = {
      id: 'primary-session-id',
      userId: user.id,
      sessionType: PRIMARY_SESSION,
      platform: 'ANDROID',
    } as AuthSessionEntity;
    manager.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(session);

    const result = await persistence.logout({
      userId: user.id,
      sessionId: session.id,
      requestedPlatform: 'IOS',
      loggedOutAt,
    });

    expect(result.androidToken).toBeNull();
    expect(result.iosToken).toBe('ios-token');
    expect(manager.findOne).toHaveBeenNthCalledWith(2, AuthSessionEntity, {
      where: expect.objectContaining({
        id: session.id,
        userId: user.id,
        sessionType: PRIMARY_SESSION,
      }),
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.update).toHaveBeenNthCalledWith(
      1,
      AuthSessionEntity,
      expect.objectContaining({ id: session.id, userId: user.id }),
      { revokedAt: loggedOutAt },
    );
    expect(manager.update).toHaveBeenNthCalledWith(
      2,
      AuthSessionEntity,
      expect.objectContaining({ parentSessionId: session.id }),
      { revokedAt: loggedOutAt },
    );
  });

  it('uses the request platform only for legacy app sessions', async () => {
    const user = { id: 7, iosToken: 'ios-token' } as UserEntity;
    manager.findOne
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce({
        id: 'legacy-session-id',
        userId: user.id,
        sessionType: PRIMARY_SESSION,
        platform: 'app',
      } as AuthSessionEntity);

    const result = await persistence.logout({
      userId: user.id,
      sessionId: 'legacy-session-id',
      requestedPlatform: 'IOS',
      loggedOutAt,
    });

    expect(result.iosToken).toBeNull();
  });

  it('does not change the user when the session is not active', async () => {
    manager.findOne
      .mockResolvedValueOnce({ id: 7 } as UserEntity)
      .mockResolvedValueOnce(null);

    await expect(
      persistence.logout({
        userId: 7,
        sessionId: 'revoked-session-id',
        requestedPlatform: 'ANDROID',
        loggedOutAt,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.update).not.toHaveBeenCalled();
  });
});
