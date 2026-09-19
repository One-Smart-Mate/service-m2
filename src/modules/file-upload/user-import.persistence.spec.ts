import { DataSource } from 'typeorm';
import { RoleEntity } from '../roles/entities/role.entity';
import { UserRoleEntity } from '../roles/entities/user-role.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UserHasSitesEntity } from '../users/entities/user.has.sites.entity';
import { UserImportPersistence } from './user-import.persistence';

describe('UserImportPersistence', () => {
  const manager = {
    save: jest.fn(),
    create: jest.fn((entity, value) => Object.assign(new entity(), value)),
  };
  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
  } as unknown as DataSource;
  const persistence = new UserImportPersistence(dataSource);

  const site = { id: 3, name: 'Site' } as SiteEntity;
  const role = { id: 4, name: 'operator' } as RoleEntity;
  const existingUser = {
    id: 10,
    email: 'existing@example.com',
  } as UserEntity;
  const newUser = {
    id: 11,
    email: 'new@example.com',
  } as UserEntity;
  const newUserData = {
    name: 'New user',
    email: 'new@example.com',
    password: 'password-hash',
    fastPasswordDigest: 'fast-password-digest',
    siteId: 3,
    createdAt: new Date('2026-09-18T12:00:00.000Z'),
    appVersion: 'dev',
    siteCode: 'SITE03',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    manager.save.mockImplementation((entity, values) => {
      if (entity === UserEntity) return Promise.resolve([newUser]);
      return Promise.resolve(values);
    });
  });

  it('writes users, site assignments and new-user roles in one transaction', async () => {
    const savedUsers = await persistence.persist({
      newUsers: [newUserData],
      existingAssignments: [{ user: existingUser }],
      rolesByEmail: new Map([[newUser.email, role]]),
      site,
      createdAt: newUserData.createdAt,
    });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(savedUsers).toEqual([newUser]);
    expect(manager.save).toHaveBeenCalledWith(UserEntity, [
      expect.objectContaining(newUserData),
    ]);
    expect(manager.save).toHaveBeenCalledWith(
      UserHasSitesEntity,
      expect.arrayContaining([
        expect.objectContaining({ user: existingUser, site }),
        expect.objectContaining({ user: newUser, site }),
      ]),
    );
    expect(manager.save).toHaveBeenCalledWith(UserRoleEntity, [
      expect.objectContaining({ user: newUser, role }),
    ]);
  });

  it('propagates a relation failure so TypeORM rolls back the batch', async () => {
    manager.save.mockImplementation((entity) => {
      if (entity === UserEntity) return Promise.resolve([newUser]);
      if (entity === UserHasSitesEntity) {
        return Promise.reject(new Error('site relation failed'));
      }
      return Promise.resolve([]);
    });

    await expect(
      persistence.persist({
        newUsers: [newUserData],
        existingAssignments: [],
        rolesByEmail: new Map([[newUser.email, role]]),
        site,
        createdAt: newUserData.createdAt,
      }),
    ).rejects.toThrow('site relation failed');
    expect(manager.save).not.toHaveBeenCalledWith(
      UserRoleEntity,
      expect.anything(),
    );
  });
});
