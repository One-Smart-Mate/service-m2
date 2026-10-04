import { ForbiddenException } from '@nestjs/common';
import { UserAdministrationPolicy as Policy } from './user-administration.policy';
import { UserRoleEntity } from 'src/modules/roles/entities/user-role.entity';

describe('user administration boundaries', () => {
  const local = { id: 1, roles: ['local_sis_admin'], siteIds: [7] };
  it.each(['ih_sis_admin', ' IH_SIS_ADMIN '])(
    'blocks privileged role %s for local administrators',
    (name) => {
      expect(() => Policy.assertRoles(local, [{ name }])).toThrow(
        ForbiddenException,
      );
    },
  );
  it('allows authorized operator assignment and global administration', () => {
    expect(() =>
      Policy.assertRoles(local, [{ name: 'operator' }]),
    ).not.toThrow();
    expect(() =>
      Policy.assertRoles({ id: 1, roles: ['ih_sis_admin'], siteIds: null }, [
        { name: 'ih_sis_admin' },
      ]),
    ).not.toThrow();
  });
  it('rejects a user with any membership outside the actor sites', async () => {
    const manager = {
      find: jest.fn((entity) =>
        Promise.resolve(
          entity === UserRoleEntity
            ? [{ role: { name: 'operator' } }]
            : [{ site: { id: 7 } }, { site: { id: 8 } }],
        ),
      ),
    };
    await expect(
      Policy.assertTarget(manager as never, local, 9),
    ).rejects.toThrow(ForbiddenException);
  });
  it('rejects changes to a global administrator even on a shared site', async () => {
    const manager = {
      find: jest.fn((entity) =>
        Promise.resolve(
          entity === UserRoleEntity
            ? [{ role: { name: 'ih_sis_admin' } }]
            : [{ site: { id: 7 } }],
        ),
      ),
    };
    await expect(
      Policy.assertTarget(manager as never, local, 9),
    ).rejects.toThrow(ForbiddenException);
  });
  it('allows self profile updates while rejecting other users for an operator', async () => {
    const actor = { id: 1, roles: ['operator'], siteIds: [7] };
    await expect(
      Policy.assertTarget({} as never, actor, 1, true),
    ).resolves.toBeUndefined();
    await expect(
      Policy.assertTarget({} as never, actor, 2, true),
    ).rejects.toThrow(ForbiddenException);
  });
});
