import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { UserRoleEntity } from 'src/modules/roles/entities/user-role.entity';
import { UserHasSitesEntity } from 'src/modules/users/entities/user.has.sites.entity';
import { PLATFORM_ADMIN_ROLE, normalizeRole } from './roles.constants';

export interface UserAdministrationActor {
  id: number;
  roles: string[];
  siteIds: number[] | null;
}

const rank = (roles: readonly string[]): number =>
  Math.max(
    0,
    ...roles.map((role) => {
      switch (normalizeRole(role)) {
        case PLATFORM_ADMIN_ROLE:
          return 3;
        case 'local_sis_admin':
          return 2;
        case 'local_admin':
          return 1;
        default:
          return 0;
      }
    }),
  );

export class UserAdministrationPolicy {
  static assertActor(actor: UserAdministrationActor): void {
    if (!actor || !Number.isSafeInteger(actor.id) || actor.id <= 0) {
      throw new UnauthorizedException('An authenticated actor is required');
    }
  }

  static assertRoles(
    actor: UserAdministrationActor,
    roles: readonly { name: string }[],
  ): void {
    this.assertActor(actor);
    if (
      rank(actor.roles) === 0 ||
      rank(roles.map((role) => role.name)) > rank(actor.roles)
    ) {
      throw new ForbiddenException(
        'These roles cannot be assigned by this user',
      );
    }
  }

  static assertSite(actor: UserAdministrationActor, siteId: number): void {
    this.assertActor(actor);
    if (rank(actor.roles) === 3) return;
    if (!actor.siteIds?.includes(Number(siteId))) {
      throw new ForbiddenException('Site access denied');
    }
  }

  static async assertTarget(
    manager: EntityManager,
    actor: UserAdministrationActor,
    userId: number,
    allowSelf = false,
  ): Promise<void> {
    this.assertActor(actor);
    if (allowSelf && Number(userId) === actor.id) return;
    if (rank(actor.roles) === 3) return;
    if (rank(actor.roles) === 0)
      throw new ForbiddenException('User administration access denied');
    const [roles, sites] = await Promise.all([
      manager.find(UserRoleEntity, {
        where: { user: { id: userId } },
        relations: { role: true },
      }),
      manager.find(UserHasSitesEntity, {
        where: { user: { id: userId }, status: 'A' },
        relations: { site: true },
      }),
    ]);
    if (
      rank(roles.map(({ role }) => role.name)) > rank(actor.roles) ||
      !sites.length ||
      sites.some(({ site }) => !actor.siteIds?.includes(Number(site.id)))
    ) {
      throw new ForbiddenException(
        'This user cannot be administered by the requester',
      );
    }
  }
}
