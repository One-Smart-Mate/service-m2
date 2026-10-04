import { ForbiddenException } from '@nestjs/common';
import { UserCreationPersistence } from './user-creation.persistence';
import { UserUpdatePersistence } from './user-update.persistence';
import { UserImportPersistence } from '../file-upload/user-import.persistence';
import { UserEntity } from './entities/user.entity';
import { UserRoleEntity } from '../roles/entities/user-role.entity';

describe('user persistence authorization', () => {
  const actor = { id: 1, roles: ['local_sis_admin'], siteIds: [7] };
  const site = { id: 7 };
  const forbiddenRoles = [{ id: 1, name: 'ih_sis_admin' }];
  const source = (manager: any) =>
    ({ transaction: (isolationOrCallback, callback?) => (callback ?? isolationOrCallback)(manager) }) as never;
  it.each(['create', 'update', 'import'])(
    'blocks privileged roles on %s before any mutation',
    async (action) => {
      const manager = { save: jest.fn(), findOne: jest.fn() };
      const dataSource = source(manager);
      const operation =
        action === 'create'
          ? new UserCreationPersistence(dataSource).persist({
              actor,
              site,
              roles: forbiddenRoles,
            } as never)
          : action === 'update'
            ? new UserUpdatePersistence(dataSource).persist({
                actor,
                siteId: 7,
                roles: forbiddenRoles,
              } as never)
            : new UserImportPersistence(dataSource).persist({
                actor,
                site,
                rolesByEmail: new Map([['email', forbiddenRoles[0]]]),
              } as never);
      await expect(operation).rejects.toThrow(ForbiddenException);
      expect(manager.save).not.toHaveBeenCalled();
      expect(manager.findOne).not.toHaveBeenCalled();
    },
  );
  it('cannot link a foreign user or replace their Fast Password', async () => {
    const user = { id: 9, fastPasswordDigest: 'original' };
    const manager = {
      findOne: jest.fn().mockResolvedValue(user),
      save: jest.fn(),
      find: jest.fn((entity) =>
        Promise.resolve(
          entity === UserRoleEntity
            ? [{ role: { name: 'operator' } }]
            : [{ site: { id: 8 } }],
        ),
      ),
    };
    await expect(
      new UserCreationPersistence(source(manager)).persist({
        actor,
        site,
        roles: [{ name: 'operator' }],
        email: 'foreign@example.com',
        newUser: { fastPasswordDigest: 'replacement' },
      } as never),
    ).rejects.toThrow(ForbiddenException);
    expect(manager.save).not.toHaveBeenCalledWith(
      UserEntity,
      expect.anything(),
    );
    expect(user.fastPasswordDigest).toBe('original');
  });
});
