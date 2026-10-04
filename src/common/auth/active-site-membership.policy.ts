import type { UserEntity } from 'src/modules/users/entities/user.entity';
import type { UserHasSitesEntity } from 'src/modules/users/entities/user.has.sites.entity';

export function getActiveSiteMemberships(
  user: UserEntity,
): UserHasSitesEntity[] {
  if (!user || user.status !== 'A' || user.deletedAt) return [];
  return (user.userHasSites ?? []).filter(
    (membership) =>
      membership.status === 'A' &&
      !membership.deletedAt &&
      membership.site?.status === 'A' &&
      !membership.site.deletedAt &&
      Number.isSafeInteger(Number(membership.site.id)) &&
      Number(membership.site.id) > 0,
  );
}

export function hasActiveSiteMembership(
  user: UserEntity,
  siteId: number,
): boolean {
  return getActiveSiteMemberships(user).some(
    (membership) => Number(membership.site.id) === siteId,
  );
}
