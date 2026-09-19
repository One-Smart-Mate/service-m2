import { DataSource } from 'typeorm';
import { ValidationException } from 'src/common/exceptions/types/validation.exception';
import { AuthSessionEntity } from '../auth-session/entities/auth-session.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { UserRoleEntity } from '../roles/entities/user-role.entity';
import { UserEntity } from './entities/user.entity';
import { UserUpdatePersistence } from './user-update.persistence';

describe('UserUpdatePersistence', () => {
  const manager = {
    exists: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    merge: jest.fn((entity, target, ...sources) =>
      Object.assign(target, ...sources),
    ),
    create: jest.fn((entity, value) => Object.assign(new entity(), value)),
    save: jest.fn((entity, value) => Promise.resolve(value)),
    remove: jest.fn((entity, value) => Promise.resolve(value)),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
  } as unknown as DataSource;
  const persistence = new UserUpdatePersistence(dataSource);

  const updatedAt = new Date('2026-09-18T14:00:00.000Z');
  const operator = { id: 1, name: 'operator' } as RoleEntity;
  const mechanic = { id: 2, name: 'mechanic' } as RoleEntity;
  const user = {
    id: 9,
    email: 'old@example.com',
    fastPasswordDigest: 'original-digest',
  } as UserEntity;

  beforeEach(() => {
    jest.clearAllMocks();
    manager.findOne.mockResolvedValue({ ...user });
    manager.exists.mockResolvedValue(false);
    manager.find.mockResolvedValue([
      { id: 20, user, role: operator } as UserRoleEntity,
    ]);
  });

  it('updates roles by user id even when the email changes', async () => {
    const result = await persistence.persist({
      userId: user.id,
      siteId: 3,
      siteCode: 'SITE03',
      update: { email: 'new@example.com', name: 'Updated' },
      roles: [mechanic],
      revokeAllSessions: false,
      updatedAt,
    });

    expect(manager.find).toHaveBeenCalledWith(UserRoleEntity, {
      where: { user: { id: user.id } },
      relations: { role: true },
    });
    expect(manager.remove).toHaveBeenCalledWith(
      UserRoleEntity,
      expect.arrayContaining([expect.objectContaining({ role: operator })]),
    );
    expect(manager.save).toHaveBeenCalledWith(UserRoleEntity, [
      expect.objectContaining({ role: mechanic }),
    ]);
    expect(result.user.email).toBe('new@example.com');
  });

  it('preserves Fast Password and sessions when no replacement is provided', async () => {
    const result = await persistence.persist({
      userId: user.id,
      siteId: 3,
      siteCode: 'SITE03',
      update: { email: user.email, name: 'Updated' },
      roles: [operator],
      revokeAllSessions: false,
      updatedAt,
    });

    expect(result.user.fastPasswordDigest).toBe('original-digest');
    expect(result.fastPasswordChanged).toBe(false);
    expect(manager.update).not.toHaveBeenCalledWith(
      AuthSessionEntity,
      expect.anything(),
      expect.anything(),
    );
  });

  it('rejects a duplicated Fast Password before persisting changes', async () => {
    manager.exists
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await expect(
      persistence.persist({
        userId: user.id,
        siteId: 3,
        siteCode: 'SITE03',
        update: { email: user.email },
        roles: [operator],
        fastPasswordDigest: 'duplicate-digest',
        revokeAllSessions: false,
        updatedAt,
      }),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('revokes primary and acting sessions when credentials change', async () => {
    await persistence.persist({
      userId: user.id,
      siteId: 3,
      siteCode: 'SITE03',
      update: { email: user.email, password: 'new-password-hash' },
      roles: [operator],
      revokeAllSessions: true,
      updatedAt,
    });

    expect(manager.update).toHaveBeenCalledWith(
      AuthSessionEntity,
      expect.objectContaining({ userId: user.id }),
      { revokedAt: updatedAt },
    );
    expect(manager.update).toHaveBeenCalledWith(
      AuthSessionEntity,
      expect.objectContaining({ actorId: user.id }),
      { revokedAt: updatedAt },
    );
  });
});
