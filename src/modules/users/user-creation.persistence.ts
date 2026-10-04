import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, DeepPartial } from 'typeorm';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import {
  UserAdministrationActor,
  UserAdministrationPolicy,
} from 'src/common/auth/user-administration.policy';
import { RoleEntity } from '../roles/entities/role.entity';
import { UserRoleEntity } from '../roles/entities/user-role.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { UserEntity } from './entities/user.entity';
import { UserHasSitesEntity } from './entities/user.has.sites.entity';
import { FastPasswordPolicy } from './fast-password.policy';

export interface PersistUserCreation {
  actor: UserAdministrationActor;
  email: string;
  newUser: DeepPartial<UserEntity> & {
    email: string;
    fastPasswordDigest: string;
  };
  roles: RoleEntity[];
  site: SiteEntity;
  createdAt: Date;
}

export interface PersistedUserCreation {
  user: UserEntity;
  userSite: UserHasSitesEntity;
  isNewUser: boolean;
  fastPasswordChanged: boolean;
}

@Injectable()
export class UserCreationPersistence {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  persist = async (
    input: PersistUserCreation,
  ): Promise<PersistedUserCreation> => {
    return this.dataSource.transaction('READ COMMITTED', async (manager) => {
      UserAdministrationPolicy.assertRoles(input.actor, input.roles);
      UserAdministrationPolicy.assertSite(input.actor, input.site.id);
      let user = await manager.findOne(UserEntity, {
        where: { email: input.email },
        lock: { mode: 'pessimistic_write' },
      });
      const isNewUser = !user;
      const fastPasswordChanged = false;

      await FastPasswordPolicy.lockSites(manager, [input.site.id]);

      if (!user) {
        await FastPasswordPolicy.assertAvailable(
          manager,
          [input.site.id],
          input.newUser.fastPasswordDigest,
        );
        user = manager.create(UserEntity, input.newUser);
        user = await manager.save(UserEntity, user);

        const userRoles = input.roles.map((role) =>
          manager.create(UserRoleEntity, {
            user,
            role,
            createdAt: input.createdAt,
          }),
        );
        await manager.save(UserRoleEntity, userRoles);
      } else {
        await UserAdministrationPolicy.assertTarget(
          manager,
          input.actor,
          user.id,
        );
        const alreadyAssigned = await manager.exists(UserHasSitesEntity, {
          where: {
            user: { id: user.id },
            site: { id: input.site.id },
          },
        });
        if (alreadyAssigned) {
          throw new ValidationException(
            ValidationExceptionType.DUPLICATED_USER,
          );
        }
        await FastPasswordPolicy.assertAvailable(
          manager,
          [input.site.id],
          user.fastPasswordDigest,
          user.id,
        );
      }

      const userSite = manager.create(UserHasSitesEntity, {
        user,
        site: input.site,
        status: 'A',
        createdAt: input.createdAt,
      });
      const savedUserSite = await manager.save(UserHasSitesEntity, userSite);

      return {
        user,
        userSite: savedUserSite,
        isNewUser,
        fastPasswordChanged,
      };
    });
  };
}
