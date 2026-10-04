import { ConflictException } from '@nestjs/common';
import { EntityManager, In, Not } from 'typeorm';
import { SiteEntity } from '../site/entities/site.entity';
import { UserEntity } from './entities/user.entity';
import { UserHasSitesEntity } from './entities/user.has.sites.entity';

export class FastPasswordConflictException extends ConflictException {
  constructor() {
    super('Fast Password is already assigned in one of the user sites');
  }
}

// Call within a READ COMMITTED transaction. The site locks serialize all PIN
// writers; each conflict lookup sees commits made while waiting for those locks.
export class FastPasswordPolicy {
  static async lockSites(
    manager: EntityManager,
    siteIds: number[],
  ): Promise<void> {
    for (const id of [...new Set(siteIds.map(Number))].sort((a, b) => a - b)) {
      if (
        !Number.isSafeInteger(id) ||
        id <= 0 ||
        !(await manager.findOne(SiteEntity, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        }))
      )
        throw new ConflictException('Fast Password site is unavailable');
    }
  }

  static async assertAvailable(
    manager: EntityManager,
    siteIds: number[],
    digest?: string,
    userId?: number,
  ): Promise<void> {
    if (!digest || siteIds.length === 0) return;
    if (
      await manager.exists(UserEntity, {
        where: {
          fastPasswordDigest: digest,
          ...(userId ? { id: Not(userId) } : {}),
          userHasSites: { site: { id: In(siteIds) } },
        },
      })
    )
      throw new FastPasswordConflictException();
  }

  static async assertForUser(
    manager: EntityManager,
    userId: number,
    digest: string,
    additionalSites: number[] = [],
  ): Promise<void> {
    const memberships = await manager.find(UserHasSitesEntity, {
      where: { user: { id: userId } },
      relations: { site: true },
    });
    const siteIds = [
      ...new Set([
        ...additionalSites,
        ...memberships.map(({ site }) => Number(site.id)),
      ]),
    ];
    await this.lockSites(manager, siteIds);
    await this.assertAvailable(manager, siteIds, digest, userId);
  }
}
