import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import * as bcryptjs from 'bcryptjs';
import { DataSource, IsNull } from 'typeorm';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { AuthSessionEntity } from '../auth-session/entities/auth-session.entity';
import { UserEntity } from './entities/user.entity';

export interface PersistPasswordReset {
  email: string;
  resetCode: string;
  passwordHash: string;
  resetAt: Date;
}

@Injectable()
export class PasswordResetPersistence {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  reset = async (input: PersistPasswordReset): Promise<void> => {
    await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(UserEntity, {
        where: { email: input.email },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user?.resetCode || !user.resetCodeExpiration) {
        throw new ValidationException(
          ValidationExceptionType.WRONG_RESET_CODE,
        );
      }
      if (input.resetAt > user.resetCodeExpiration) {
        throw new ValidationException(
          ValidationExceptionType.RESETCODE_EXPIRED,
        );
      }

      const isCodeValid = await bcryptjs.compare(
        input.resetCode,
        user.resetCode,
      );
      if (!isCodeValid) {
        throw new ValidationException(
          ValidationExceptionType.WRONG_RESET_CODE,
        );
      }

      user.password = input.passwordHash;
      user.resetCode = null;
      user.resetCodeExpiration = null;
      user.updatedAt = input.resetAt;
      await manager.save(UserEntity, user);

      await manager.update(
        AuthSessionEntity,
        { userId: user.id, revokedAt: IsNull() },
        { revokedAt: input.resetAt },
      );
      await manager.update(
        AuthSessionEntity,
        { actorId: user.id, revokedAt: IsNull() },
        { revokedAt: input.resetAt },
      );
    });
  };
}
