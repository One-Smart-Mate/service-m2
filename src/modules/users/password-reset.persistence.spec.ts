import * as bcryptjs from 'bcryptjs';
import { DataSource } from 'typeorm';
import { ValidationException } from 'src/common/exceptions/types/validation.exception';
import { AuthSessionEntity } from '../auth-session/entities/auth-session.entity';
import { UserEntity } from './entities/user.entity';
import { PasswordResetPersistence } from './password-reset.persistence';

describe('PasswordResetPersistence', () => {
  const manager = {
    findOne: jest.fn(),
    save: jest.fn((entity, value) => Promise.resolve(value)),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
  } as unknown as DataSource;
  const persistence = new PasswordResetPersistence(dataSource);
  const resetAt = new Date('2026-09-19T12:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('consumes the code and revokes owned and acting sessions atomically', async () => {
    const resetCode = 'ABC123';
    const user = {
      id: 7,
      email: 'user@example.com',
      password: 'old-password-hash',
      resetCode: await bcryptjs.hash(resetCode, 4),
      resetCodeExpiration: new Date(resetAt.getTime() + 60_000),
    } as UserEntity;
    manager.findOne.mockResolvedValue(user);

    await persistence.reset({
      email: user.email,
      resetCode,
      passwordHash: 'new-password-hash',
      resetAt,
    });

    expect(manager.findOne).toHaveBeenCalledWith(UserEntity, {
      where: { email: user.email },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.save).toHaveBeenCalledWith(
      UserEntity,
      expect.objectContaining({
        password: 'new-password-hash',
        resetCode: null,
        resetCodeExpiration: null,
        updatedAt: resetAt,
      }),
    );
    expect(manager.update).toHaveBeenCalledWith(
      AuthSessionEntity,
      expect.objectContaining({ userId: user.id }),
      { revokedAt: resetAt },
    );
    expect(manager.update).toHaveBeenCalledWith(
      AuthSessionEntity,
      expect.objectContaining({ actorId: user.id }),
      { revokedAt: resetAt },
    );
  });

  it('rejects an expired code without changing credentials or sessions', async () => {
    manager.findOne.mockResolvedValue({
      id: 7,
      resetCode: await bcryptjs.hash('ABC123', 4),
      resetCodeExpiration: new Date(resetAt.getTime() - 1),
    } as UserEntity);

    await expect(
      persistence.reset({
        email: 'user@example.com',
        resetCode: 'ABC123',
        passwordHash: 'new-password-hash',
        resetAt,
      }),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.update).not.toHaveBeenCalled();
  });

  it('cannot reuse a code after it has been consumed', async () => {
    const user = {
      id: 7,
      resetCode: await bcryptjs.hash('ABC123', 4),
      resetCodeExpiration: new Date(resetAt.getTime() + 60_000),
    } as UserEntity;
    manager.findOne.mockResolvedValue(user);
    const input = {
      email: 'user@example.com',
      resetCode: 'ABC123',
      passwordHash: 'new-password-hash',
      resetAt,
    };

    await persistence.reset(input);
    await expect(persistence.reset(input)).rejects.toBeInstanceOf(
      ValidationException,
    );
  });
});
