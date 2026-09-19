import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull } from 'typeorm';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { stringConstants } from 'src/utils/string.constant';
import { AuthSessionEntity } from '../auth-session/entities/auth-session.entity';
import { PRIMARY_SESSION } from '../auth/models/auth-token.payload';
import { UserEntity } from './entities/user.entity';

export interface PersistUserLogout {
  userId: number;
  sessionId: string;
  requestedPlatform: string;
  loggedOutAt: Date;
}

@Injectable()
export class UserLogoutPersistence {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  logout = async (input: PersistUserLogout): Promise<UserEntity> => {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(UserEntity, {
        where: { id: input.userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const session = await manager.findOne(AuthSessionEntity, {
        where: {
          id: input.sessionId,
          userId: input.userId,
          sessionType: PRIMARY_SESSION,
          revokedAt: IsNull(),
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (!session) {
        throw new UnauthorizedException('Session is no longer active');
      }

      const knownPlatforms = [
        stringConstants.OS_ANDROID,
        stringConstants.OS_IOS,
        stringConstants.OS_WEB,
      ];
      const platform = knownPlatforms.includes(session.platform)
        ? session.platform
        : input.requestedPlatform;

      switch (platform) {
        case stringConstants.OS_ANDROID:
          user.androidToken = null;
          break;
        case stringConstants.OS_IOS:
          user.iosToken = null;
          break;
        case stringConstants.OS_WEB:
          user.webToken = null;
          break;
        default:
          throw new UnauthorizedException('Invalid session platform');
      }

      user.updatedAt = input.loggedOutAt;
      const savedUser = await manager.save(UserEntity, user);

      await manager.update(
        AuthSessionEntity,
        { id: session.id, userId: input.userId, revokedAt: IsNull() },
        { revokedAt: input.loggedOutAt },
      );
      await manager.update(
        AuthSessionEntity,
        { parentSessionId: session.id, revokedAt: IsNull() },
        { revokedAt: input.loggedOutAt },
      );

      return savedUser;
    });
  };
}
