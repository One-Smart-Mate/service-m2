import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, MoreThan, Repository } from 'typeorm';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UserHasSitesEntity } from '../users/entities/user.has.sites.entity';
import { SiteEntity } from '../site/entities/site.entity';

export interface VerifiedSessionCredential {
  type: 'password' | 'fastPassword';
  value: string;
  siteId: number;
}

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

  async createSession(
    data: CreateAuthSession,
    credential: VerifiedSessionCredential,
  ): Promise<boolean> {
    return this.sessionRepository.manager.transaction(async (manager) => {
      const users = await this.lockActiveUsers(manager, [data.userId]);
      const user = users.get(Number(data.userId));
      if (
        data.sessionType !== 'primary' ||
        credential.type !== 'password' ||
        !user ||
        !credential.value ||
        user.password !== credential.value ||
        !(await this.lockMemberships(manager, credential.siteId, [data.userId]))
      ) {
        return false;
      }
      await manager.insert(AuthSessionEntity, {
        ...data,
        actorId: null,
        parentSessionId: null,
        createdAt: new Date(),
        revokedAt: null,
      });
      return true;
    });
  }

  async createChildSession(
    data: CreateAuthSession,
    parentSessionId: string,
    actorId: number,
    credential: VerifiedSessionCredential,
  ): Promise<boolean> {
    return this.sessionRepository.manager.transaction(async (manager) => {
      // Credential writers lock the user before sites and sessions. Keep that
      // order, including both identities, before locking the parent session.
      const users = await this.lockActiveUsers(manager, [actorId, data.userId]);
      const target = users.get(Number(data.userId));
      if (
        data.sessionType !== 'fast' ||
        credential.type !== 'fastPassword' ||
        !target ||
        !credential.value ||
        target.fastPasswordDigest !== credential.value ||
        !users.has(Number(actorId)) ||
        !(await this.lockMemberships(manager, credential.siteId, [
          actorId,
          data.userId,
        ]))
      ) {
        return false;
      }
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

  private async lockActiveUsers(manager: EntityManager, ids: number[]) {
    const users = new Map<number, UserEntity>();
    for (const id of [...new Set(ids.map(Number))].sort((a, b) => a - b)) {
      if (!Number.isSafeInteger(id) || id <= 0) continue;
      const user = await manager.findOne(UserEntity, {
        where: { id, status: 'A', deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (user) users.set(id, user);
    }
    return users;
  }

  private async lockMemberships(
    manager: EntityManager,
    siteId: number,
    ids: number[],
  ) {
    if (!Number.isSafeInteger(Number(siteId)) || Number(siteId) <= 0)
      return false;
    const site = await manager.findOne(SiteEntity, {
      where: { id: Number(siteId), status: 'A', deletedAt: IsNull() },
      lock: { mode: 'pessimistic_read' },
    });
    if (!site) return false;
    for (const id of [...new Set(ids.map(Number))].sort((a, b) => a - b)) {
      const membership = await manager.findOne(UserHasSitesEntity, {
        where: {
          user: { id },
          site: { id: Number(siteId) },
          status: 'A',
          deletedAt: IsNull(),
        },
        lock: { mode: 'pessimistic_read' },
      });
      if (!membership) return false;
    }
    return true;
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
      // Serialize refresh with credential replacement and account disablement.
      const users = await this.lockActiveUsers(manager, [userId]);
      if (
        !users.has(Number(userId)) ||
        Number(replacement.userId) !== Number(userId)
      ) {
        return false;
      }
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
