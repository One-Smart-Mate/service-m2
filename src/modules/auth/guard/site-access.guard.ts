import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { UsersService } from 'src/modules/users/users.service';

export const SKIP_SITE_ACCESS_KEY = 'skipSiteAccess';
export const REQUIRE_SITE_ACCESS_KEY = 'requireSiteAccess';
const GLOBAL_SITE_ACCESS_ROLE = 'ih_sis_admin';

@Injectable()
export class SiteAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const skipSiteAccess = this.reflector.getAllAndOverride<boolean>(
      SKIP_SITE_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipSiteAccess) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const siteIds = this.extractSiteIds(request);

    if (siteIds.length === 0) {
      const requireSiteAccess = this.reflector.getAllAndOverride<boolean>(
        REQUIRE_SITE_ACCESS_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (requireSiteAccess) {
        if (await this.hasGlobalSiteAccess(user.id)) {
          return true;
        }
        throw new BadRequestException('siteId is required');
      }
      return true;
    }

    await this.validateSiteAccess(siteIds, user.id);

    return true;
  }

  private extractSiteIds(request: any): number[] {
    const rawSiteIds: unknown[] = [];

    this.collectSiteIds(request.params, rawSiteIds);
    this.collectSiteIds(request.query, rawSiteIds);
    this.collectSiteIds(request.body, rawSiteIds);

    return [
      ...new Set(rawSiteIds.flatMap((value) => this.parseSiteIds(value))),
    ];
  }

  private collectSiteIds(value: unknown, siteIds: unknown[], depth = 0): void {
    if (!value || typeof value !== 'object' || depth > 5) {
      return;
    }

    for (const [key, nestedValue] of Object.entries(value)) {
      const normalizedKey = key.replace(/[_-]/g, '').toLowerCase();

      if (
        normalizedKey === 'siteid' ||
        normalizedKey === 'siteids' ||
        normalizedKey === 'sitesids'
      ) {
        siteIds.push(nestedValue);
        continue;
      }

      this.collectSiteIds(nestedValue, siteIds, depth + 1);
    }
  }

  private parseSiteIds(value: unknown): number[] {
    const values = Array.isArray(value) ? value : [value];

    return values.map((rawValue) => {
      const siteId =
        typeof rawValue === 'number'
          ? rawValue
          : Number(String(rawValue).trim());

      if (!Number.isSafeInteger(siteId) || siteId <= 0) {
        throw new BadRequestException('Invalid siteId');
      }

      return siteId;
    });
  }

  private async validateSiteAccess(
    siteIds: number[],
    userId: number,
  ): Promise<void> {
    if (await this.hasGlobalSiteAccess(userId)) {
      return;
    }

    const authUser = await this.usersService.findByIdWithSites(userId);
    if (!authUser) {
      throw new UnauthorizedException('User not found');
    }

    if (!authUser.userHasSites?.length) {
      throw new UnauthorizedException('User has no site access');
    }

    const allowedSiteIds = new Set(
      authUser.userHasSites.map((userSite) => Number(userSite.site.id)),
    );
    const hasAccessToAllSites = siteIds.every((siteId) =>
      allowedSiteIds.has(siteId),
    );

    if (!hasAccessToAllSites) {
      throw new ForbiddenException('Site access denied');
    }
  }

  private async hasGlobalSiteAccess(userId: number): Promise<boolean> {
    const userRoles = await this.usersService.getUserRoles(userId);

    return userRoles.some(
      (role) => role?.trim().toLowerCase() === GLOBAL_SITE_ACCESS_ROLE,
    );
  }
}
