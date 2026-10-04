import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PLATFORM_ADMIN_ROLE,
  normalizeRole,
} from 'src/common/auth/roles.constants';
import { REQUIRED_ROLES_KEY } from 'src/common/decorators/roles.decorator';
import {
  SELF_OR_ROLES_KEY,
  SelfOrRolesOptions,
} from 'src/common/decorators/self-or-roles.decorator';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const selfOrRoles = this.reflector.getAllAndOverride<SelfOrRolesOptions>(
      SELF_OR_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length && !selfOrRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = Number(request.user?.id);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (selfOrRoles) {
      const subjectId = Number(
        request[selfOrRoles.source]?.[selfOrRoles.requestKey],
      );
      if (Number.isSafeInteger(subjectId) && subjectId === userId) {
        return true;
      }
    }

    const userRoles = (await this.usersService.getUserRoles(userId)).map(
      normalizeRole,
    );

    if (userRoles.includes(PLATFORM_ADMIN_ROLE)) {
      return true;
    }

    const allowedRoles = (selfOrRoles?.roles ?? requiredRoles ?? []).map(
      normalizeRole,
    );
    if (allowedRoles.some((role) => userRoles.includes(role))) {
      return true;
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}
