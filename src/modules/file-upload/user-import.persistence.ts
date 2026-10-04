import { ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RoleEntity } from '../roles/entities/role.entity';
import { UserRoleEntity } from '../roles/entities/user-role.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UserHasSitesEntity } from '../users/entities/user.has.sites.entity';
import { CreateUsersDTO } from './dto/create.users.dto';
import {
  FastPasswordConflictException,
  FastPasswordPolicy,
} from '../users/fast-password.policy';
import {
  UserAdministrationActor,
  UserAdministrationPolicy,
} from 'src/common/auth/user-administration.policy';

export interface ExistingUserSiteAssignment {
  user: UserEntity;
}

export interface PersistUserImport {
  actor: UserAdministrationActor;
  newUsers: CreateUsersDTO[];
  existingAssignments: ExistingUserSiteAssignment[];
  rolesByEmail: ReadonlyMap<string, RoleEntity>;
  site: SiteEntity;
  createdAt: Date;
}

@Injectable()
export class UserImportPersistence {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  persist = async (input: PersistUserImport): Promise<UserEntity[]> => {
    return this.dataSource.transaction('READ COMMITTED', async (manager) => {
      UserAdministrationPolicy.assertRoles(input.actor, [
        ...input.rolesByEmail.values(),
      ]);
      UserAdministrationPolicy.assertSite(input.actor, input.site.id);
      const existingUsers: UserEntity[] = [];
      for (const assignment of [...input.existingAssignments].sort(
        (a, b) => a.user.id - b.user.id,
      )) {
        const user = await manager.findOne(UserEntity, {
          where: { id: assignment.user.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!user)
          throw new ConflictException('Imported user no longer exists');
        existingUsers.push(user);
        await UserAdministrationPolicy.assertTarget(
          manager,
          input.actor,
          user.id,
        );
      }
      await FastPasswordPolicy.lockSites(manager, [input.site.id]);
      const newUserEntities = input.newUsers.map((user) =>
        manager.create(UserEntity, user),
      );
      const savedUsers = newUserEntities.length
        ? await manager.save(UserEntity, newUserEntities)
        : [];

      const usersToAssign = [...existingUsers, ...savedUsers];

      if (usersToAssign.length === 0) {
        return savedUsers;
      }

      const digests = new Set<string>();
      for (const user of usersToAssign) {
        if (user.fastPasswordDigest && digests.has(user.fastPasswordDigest)) {
          throw new FastPasswordConflictException();
        }
        if (user.fastPasswordDigest) digests.add(user.fastPasswordDigest);
        if (
          await manager.exists(UserHasSitesEntity, {
            where: { user: { id: user.id }, site: { id: input.site.id } },
          })
        )
          throw new ConflictException(
            'Imported user is already assigned to this site',
          );
        await FastPasswordPolicy.assertAvailable(
          manager,
          [input.site.id],
          user.fastPasswordDigest,
          user.id,
        );
      }

      const siteAssignments = usersToAssign.map((user) =>
        manager.create(UserHasSitesEntity, {
          user,
          site: input.site,
          status: 'A',
          createdAt: input.createdAt,
        }),
      );
      await manager.save(UserHasSitesEntity, siteAssignments);

      const roleAssignments: UserRoleEntity[] = [];
      for (const user of savedUsers) {
        const role = input.rolesByEmail.get(user.email);
        if (role) {
          roleAssignments.push(
            manager.create(UserRoleEntity, {
              user,
              role,
              createdAt: input.createdAt,
            }),
          );
        }
      }
      if (roleAssignments.length > 0) {
        await manager.save(UserRoleEntity, roleAssignments);
      }

      return savedUsers;
    });
  };
}
