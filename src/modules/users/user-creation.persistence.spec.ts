import { DataSource } from 'typeorm';
import { ValidationException } from 'src/common/exceptions/types/validation.exception';
import { RoleEntity } from '../roles/entities/role.entity';
import { UserRoleEntity } from '../roles/entities/user-role.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { UserCreationPersistence } from './user-creation.persistence';
import { UserEntity } from './entities/user.entity';
import { UserHasSitesEntity } from './entities/user.has.sites.entity';

describe('UserCreationPersistence', () => {
  const manager = {
    exists: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    create: jest.fn((entity, value) => Object.assign(new entity(), value)),
  };
  const dataSource = {
    transaction: jest.fn((isolationOrCallback, callback?) => (callback ?? isolationOrCallback)(manager)),
  } as unknown as DataSource;
  const persistence = new UserCreationPersistence(dataSource);

  const createdAt = new Date('2026-09-18T12:00:00.000Z');
  const site = { id: 3, siteCode: 'SITE03' } as SiteEntity;
  const role = { id: 4, name: 'operator' } as RoleEntity;
  const newUserData = {
    name: 'New user',
    email: 'new@example.com',
    password: 'password-hash',
    fastPasswordDigest: 'new-fast-password-digest',
    siteCode: site.siteCode,
    createdAt,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    manager.findOne.mockImplementation(entity => Promise.resolve(entity === SiteEntity ? site : null));
    manager.exists.mockResolvedValue(false);
    manager.save.mockImplementation((entity, value) =>
      Promise.resolve(value),
    );
    manager.update.mockResolvedValue({ affected: 1 });
  });

  it('creates the user, roles and site assignment atomically', async () => {
    const result = await persistence.persist({
      actor: { id: 1, roles: ['ih_sis_admin'], siteIds: null },
      email: newUserData.email,
      newUser: newUserData,
      roles: [role],
      site,
      createdAt,
    });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(result.isNewUser).toBe(true);
    expect(manager.save).toHaveBeenCalledWith(
      UserEntity,
      expect.objectContaining({ email: newUserData.email }),
    );
    expect(manager.save).toHaveBeenCalledWith(UserRoleEntity, [
      expect.objectContaining({ role }),
    ]);
    expect(manager.save).toHaveBeenCalledWith(
      UserHasSitesEntity,
      expect.objectContaining({ site, status: 'A' }),
    );
  });

  it('rejects an existing user already assigned to the site', async () => {
    manager.findOne.mockResolvedValue({
      id: 9,
      email: newUserData.email,
      fastPasswordDigest: 'old-digest',
    } as UserEntity);
    manager.exists.mockResolvedValue(true);

    await expect(
      persistence.persist({
      actor: { id: 1, roles: ['ih_sis_admin'], siteIds: null },
        email: newUserData.email,
        newUser: newUserData,
        roles: [role],
        site,
        createdAt,
      }),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('preserves existing credentials and global roles when linking another site', async () => {
    const existingUser = {
      id: 9,
      email: newUserData.email,
      fastPasswordDigest: 'old-digest',
    } as UserEntity;
    manager.findOne.mockResolvedValue(existingUser);

    const result = await persistence.persist({
      actor: { id: 1, roles: ['ih_sis_admin'], siteIds: null },
      email: newUserData.email,
      newUser: newUserData,
      roles: [role],
      site,
      createdAt,
    });

    expect(result.fastPasswordChanged).toBe(false);
    expect(existingUser.fastPasswordDigest).toBe('old-digest');
    expect(manager.save).not.toHaveBeenCalledWith(UserEntity, expect.anything());
    expect(manager.update).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalledWith(
      UserRoleEntity,
      expect.anything(),
    );
    expect(manager.save).toHaveBeenCalledWith(
      UserHasSitesEntity,
      expect.objectContaining({ user: existingUser, site }),
    );
  });

  it('propagates a role failure so the complete transaction rolls back', async () => {
    manager.save.mockImplementation((entity, value) => {
      if (entity === UserRoleEntity) {
        return Promise.reject(new Error('role assignment failed'));
      }
      return Promise.resolve(value);
    });

    await expect(
      persistence.persist({
      actor: { id: 1, roles: ['ih_sis_admin'], siteIds: null },
        email: newUserData.email,
        newUser: newUserData,
        roles: [role],
        site,
        createdAt,
      }),
    ).rejects.toThrow('role assignment failed');
    expect(manager.save).not.toHaveBeenCalledWith(
      UserHasSitesEntity,
      expect.anything(),
    );
  });
});
