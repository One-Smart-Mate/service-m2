import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, DeepPartial, IsNull } from 'typeorm';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { AuthSessionEntity } from '../auth-session/entities/auth-session.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { UserRoleEntity } from '../roles/entities/user-role.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { UserEntity } from './entities/user.entity';
import { UserHasSitesEntity } from './entities/user.has.sites.entity';

export interface PersistUserCreation {
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
    return this.dataSource.transaction(async (manager) => {
      let user = await manager.findOne(UserEntity, {
        where: { email: input.email },
        lock: { mode: 'pessimistic_write' },
      });
      const isNewUser = !user;
      let fastPasswordChanged = false;

      if (!user) {
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

        fastPasswordChanged =
          user.fastPasswordDigest !== input.newUser.fastPasswordDigest;
        if (fastPasswordChanged) {
          user.fastPasswordDigest = input.newUser.fastPasswordDigest;
          user.updatedAt = input.createdAt;
          user = await manager.save(UserEntity, user);
          await manager.update(
            AuthSessionEntity,
            {
              userId: user.id,
              sessionType: 'fast',
              revokedAt: IsNull(),
            },
            { revokedAt: input.createdAt },
          );
        }
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
