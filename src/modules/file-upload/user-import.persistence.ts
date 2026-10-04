import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RoleEntity } from '../roles/entities/role.entity';
import { UserRoleEntity } from '../roles/entities/user-role.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UserHasSitesEntity } from '../users/entities/user.has.sites.entity';
import { CreateUsersDTO } from './dto/create.users.dto';

export interface ExistingUserSiteAssignment {
  user: UserEntity;
}

export interface PersistUserImport {
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
    return this.dataSource.transaction(async (manager) => {
      const newUserEntities = input.newUsers.map((user) =>
        manager.create(UserEntity, user),
      );
      const savedUsers = newUserEntities.length
        ? await manager.save(UserEntity, newUserEntities)
        : [];

      const usersToAssign = [
        ...input.existingAssignments.map(({ user }) => user),
        ...savedUsers,
      ];

      if (usersToAssign.length === 0) {
        return savedUsers;
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
