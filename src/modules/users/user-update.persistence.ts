import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, DeepPartial, In, IsNull, Not } from 'typeorm';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { AuthSessionEntity } from '../auth-session/entities/auth-session.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { UserRoleEntity } from '../roles/entities/user-role.entity';
import { UserEntity } from './entities/user.entity';
import { UserHasSitesEntity } from './entities/user.has.sites.entity';

export interface PersistUserUpdate {
  userId: number;
  siteId: number;
  update: DeepPartial<UserEntity>;
  roles: RoleEntity[];
  fastPasswordDigest?: string;
  revokeAllSessions: boolean;
  updatedAt: Date;
}

export interface PersistUserPartialUpdate {
  userId: number;
  update: DeepPartial<UserEntity>;
  fastPasswordDigest?: string;
  updatedAt: Date;
}

export interface PersistedUserUpdate {
  user: UserEntity;
  fastPasswordChanged: boolean;
}

@Injectable()
export class UserUpdatePersistence {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  persist = async (
    input: PersistUserUpdate,
  ): Promise<PersistedUserUpdate> => {
    return this.dataSource.transaction(async (manager) => {
      let user = await manager.findOne(UserEntity, {
        where: { id: input.userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const duplicateEmail = await manager.exists(UserEntity, {
        where: {
          email: input.update.email as string,
          id: Not(input.userId),
        },
      });
      if (duplicateEmail) {
        throw new ValidationException(ValidationExceptionType.DUPLICATED_USER);
      }

      if (input.fastPasswordDigest) {
        const duplicateFastPassword = await manager.exists(UserEntity, {
          where: {
            fastPasswordDigest: input.fastPasswordDigest,
            userHasSites: { site: { id: input.siteId } },
            id: Not(input.userId),
          },
        });
        if (duplicateFastPassword) {
          throw new ValidationException(ValidationExceptionType.DUPLICATED_USER);
        }
      }

      const fastPasswordChanged = Boolean(
        input.fastPasswordDigest &&
          user.fastPasswordDigest !== input.fastPasswordDigest,
      );
      user = manager.merge(UserEntity, user, input.update, {
        ...(input.fastPasswordDigest
          ? { fastPasswordDigest: input.fastPasswordDigest }
          : {}),
        updatedAt: input.updatedAt,
      });
      user = await manager.save(UserEntity, user);

      const currentUserRoles = await manager.find(UserRoleEntity, {
        where: { user: { id: input.userId } },
        relations: { role: true },
      });
      const requestedRoleIds = new Set(input.roles.map(({ id }) => id));
      const rolesToRemove = currentUserRoles.filter(
        ({ role }) => !requestedRoleIds.has(role.id),
      );
      if (rolesToRemove.length > 0) {
        await manager.remove(UserRoleEntity, rolesToRemove);
      }

      const currentRoleIds = new Set(
        currentUserRoles.map(({ role }) => role.id),
      );
      const rolesToAdd = input.roles
        .filter(({ id }) => !currentRoleIds.has(id))
        .map((role) =>
          manager.create(UserRoleEntity, {
            user,
            role,
            createdAt: input.updatedAt,
          }),
        );
      if (rolesToAdd.length > 0) {
        await manager.save(UserRoleEntity, rolesToAdd);
      }

      if (input.revokeAllSessions) {
        await manager.update(
          AuthSessionEntity,
          { userId: input.userId, revokedAt: IsNull() },
          { revokedAt: input.updatedAt },
        );
        await manager.update(
          AuthSessionEntity,
          { actorId: input.userId, revokedAt: IsNull() },
          { revokedAt: input.updatedAt },
        );
      } else if (fastPasswordChanged) {
        await manager.update(
          AuthSessionEntity,
          {
            userId: input.userId,
            sessionType: 'fast',
            revokedAt: IsNull(),
          },
          { revokedAt: input.updatedAt },
        );
      }

      return { user, fastPasswordChanged };
    });
  };

  persistPartial = async (
    input: PersistUserPartialUpdate,
  ): Promise<PersistedUserUpdate> => {
    return this.dataSource.transaction(async (manager) => {
      let user = await manager.findOne(UserEntity, {
        where: { id: input.userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      if (typeof input.update.email === 'string') {
        const duplicateEmail = await manager.exists(UserEntity, {
          where: {
            email: input.update.email,
            id: Not(input.userId),
          },
        });
        if (duplicateEmail) {
          throw new ValidationException(
            ValidationExceptionType.DUPLICATED_USER,
          );
        }
      }

      if (input.fastPasswordDigest) {
        const userSites = await manager.find(UserHasSitesEntity, {
          where: { user: { id: input.userId } },
          relations: { site: true },
        });
        const siteIds = userSites.map(({ site }) => site.id);
        if (siteIds.length > 0) {
          const duplicateFastPassword = await manager.exists(UserEntity, {
            where: {
              fastPasswordDigest: input.fastPasswordDigest,
              userHasSites: { site: { id: In(siteIds) } },
              id: Not(input.userId),
            },
          });
          if (duplicateFastPassword) {
            throw new ValidationException(
              ValidationExceptionType.DUPLICATED_USER,
            );
          }
        }
      }

      const passwordChanged = typeof input.update.password === 'string';
      const fastPasswordChanged = Boolean(
        input.fastPasswordDigest &&
          user.fastPasswordDigest !== input.fastPasswordDigest,
      );
      user = manager.merge(UserEntity, user, input.update, {
        ...(input.fastPasswordDigest
          ? { fastPasswordDigest: input.fastPasswordDigest }
          : {}),
        updatedAt: input.updatedAt,
      });
      user = await manager.save(UserEntity, user);

      if (passwordChanged) {
        await manager.update(
          AuthSessionEntity,
          { userId: input.userId, revokedAt: IsNull() },
          { revokedAt: input.updatedAt },
        );
        await manager.update(
          AuthSessionEntity,
          { actorId: input.userId, revokedAt: IsNull() },
          { revokedAt: input.updatedAt },
        );
      } else if (fastPasswordChanged) {
        await manager.update(
          AuthSessionEntity,
          {
            userId: input.userId,
            sessionType: 'fast',
            revokedAt: IsNull(),
          },
          { revokedAt: input.updatedAt },
        );
      }

      return { user, fastPasswordChanged };
    });
  };
}
