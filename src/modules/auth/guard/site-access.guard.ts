import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from 'src/modules/users/users.service';

export const SKIP_SITE_ACCESS_KEY = 'skipSiteAccess';

@Injectable()
export class SiteAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route should skip site access validation
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

    // Extract siteId from params, query, or body
    const siteId = this.extractSiteId(request);

    if (!siteId) {
      // If no siteId found, skip validation (some endpoints don't need it)
      return true;
    }

    // Validate user has access to this site
    await this.validateSiteAccess(Number(siteId), user.id);

    return true;
  }

  private extractSiteId(request: any): number | null {
    // Try to get siteId from different sources
    if (request.params?.siteId) {
      return Number(request.params.siteId);
    }
    if (request.query?.siteId) {
      return Number(request.query.siteId);
    }
    if (request.body?.siteId) {
      return Number(request.body.siteId);
    }
    return null;
  }

  private async validateSiteAccess(
    siteId: number,
    userId: number,
  ): Promise<void> {
    // Check if user has role with id 1 (super admin role)
    const userRoleIds = await this.usersService.findUserRoleIds(userId);
    const hasRole1 = userRoleIds.includes(1);

    if (hasRole1) {
      // User has role id 1, skip site validation and allow access to any site
      return;
    }

    // User doesn't have role id 1, validate site access
    const authUser = await this.usersService.findByIdWithSites(userId);
    if (!authUser) {
      throw new UnauthorizedException('User not found');
    }

    if (!authUser.userHasSites?.length) {
      throw new UnauthorizedException('User has no site access');
    }

    const hasAccessToSite = authUser.userHasSites.some(
      (userSite) => userSite.site.id === siteId,
    );
    if (!hasAccessToSite) {
      throw new UnauthorizedException(
        `User does not have access to site ${siteId}`,
      );
    }
  }
}
