import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { AuthSessionEntity } from './entities/auth-session.entity';

export interface CreateAuthSession {
  id: string;
  userId: number;
  actorId?: number;
  parentSessionId?: string;
  sessionType: string;
  platform: string;
  expiresAt?: Date;
}

@Injectable()
export class AuthSessionService {
  constructor(
    @InjectRepository(AuthSessionEntity)
    private readonly sessionRepository: Repository<AuthSessionEntity>,
  ) {}

  async createSession(data: CreateAuthSession): Promise<void> {
    await this.sessionRepository.insert({
      ...data,
      createdAt: new Date(),
      revokedAt: null,
    });
  }

  async createChildSession(
    data: CreateAuthSession,
    parentSessionId: string,
    actorId: number,
  ): Promise<boolean> {
    return this.sessionRepository.manager.transaction(async (manager) => {
      const parent = await manager.findOne(AuthSessionEntity, {
        where: {
          id: parentSessionId,
          userId: actorId,
          revokedAt: IsNull(),
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (
        !parent ||
        parent.sessionType !== 'primary' ||
        (parent.expiresAt && parent.expiresAt.getTime() <= Date.now())
      ) {
        return false;
      }

      await manager.insert(AuthSessionEntity, {
        ...data,
        actorId,
        parentSessionId,
        createdAt: new Date(),
        revokedAt: null,
      });
      return true;
    });
  }

  async isSessionActive(sessionId: string, userId: number): Promise<boolean> {
    if (!sessionId || !Number.isSafeInteger(Number(userId))) {
      return false;
    }

    const now = new Date();
    return this.sessionRepository.exists({
      where: [
        {
          id: sessionId,
          userId,
          revokedAt: IsNull(),
          expiresAt: IsNull(),
        },
        {
          id: sessionId,
          userId,
          revokedAt: IsNull(),
          expiresAt: MoreThan(now),
        },
      ],
    });
  }

  async revokeSession(sessionId: string, userId: number): Promise<boolean> {
    if (!sessionId) {
      return false;
    }

    return this.sessionRepository.manager.transaction(async (manager) => {
      const revokedAt = new Date();
      const result = await manager.update(
        AuthSessionEntity,
        { id: sessionId, userId, revokedAt: IsNull() },
        { revokedAt },
      );

      if (!result.affected) {
        return false;
      }

      await manager.update(
        AuthSessionEntity,
        { parentSessionId: sessionId, revokedAt: IsNull() },
        { revokedAt },
      );
      return true;
    });
  }

  async rotateSession(
    currentSessionId: string,
    userId: number,
    replacement: CreateAuthSession,
  ): Promise<boolean> {
    return this.sessionRepository.manager.transaction(async (manager) => {
      const revokedAt = new Date();
      const result = await manager.update(
        AuthSessionEntity,
        { id: currentSessionId, userId, revokedAt: IsNull() },
        { revokedAt },
      );
      if (!result.affected) {
        return false;
      }

      await manager.update(
        AuthSessionEntity,
        { parentSessionId: currentSessionId, revokedAt: IsNull() },
        { revokedAt },
      );
      await manager.insert(AuthSessionEntity, {
        ...replacement,
        createdAt: new Date(),
        revokedAt: null,
      });
      return true;
    });
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.sessionRepository
      .createQueryBuilder()
      .update(AuthSessionEntity)
      .set({ revokedAt: new Date() })
      .where('(user_id = :userId OR actor_id = :userId)', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  async revokeFastSessionsForUser(userId: number): Promise<void> {
    await this.sessionRepository
      .createQueryBuilder()
      .update(AuthSessionEntity)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('session_type = :sessionType', { sessionType: 'fast' })
      .andWhere('revoked_at IS NULL')
      .execute();
  }
}
