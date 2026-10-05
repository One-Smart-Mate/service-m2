import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { AuthSessionService } from 'src/modules/auth-session/auth-session.service';
import { UsersService } from 'src/modules/users/users.service';
import { AuthTokenPayload, FAST_SESSION } from '../models/auth-token.payload';
import { stringConstants } from 'src/utils/string.constant';
import { hasActiveSiteMembership } from 'src/common/auth/active-site-membership.policy';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private readonly authSessionService: AuthSessionService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    let payload: AuthTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AuthTokenPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }
    if (!payload?.id || !payload.jti) {
      throw new UnauthorizedException();
    }

    const isFastSession = payload.sessionType === FAST_SESSION;
    const loadUser = (id: number) =>
      isFastSession
        ? this.usersService.findByIdWithSites(id)
        : this.usersService.findById(id);
    const [sessionActive, user, actor] = await Promise.all([
      this.authSessionService.isSessionActive(payload.jti, payload.id),
      loadUser(payload.id),
      payload.actorId ? loadUser(payload.actorId) : Promise.resolve(null),
    ]);
    const isActive = (candidate: { status?: string }) =>
      candidate?.status !== stringConstants.inactiveStatus &&
      candidate?.status !== stringConstants.cancelledStatus;

    if (!sessionActive || !user || !isActive(user)) {
      throw new UnauthorizedException();
    }
    if (payload.actorId && (!actor || !isActive(actor))) {
      throw new UnauthorizedException();
    }
    if (
      isFastSession &&
      (!Number.isSafeInteger(payload.fastSiteId) ||
        payload.fastSiteId <= 0 ||
        !Number.isSafeInteger(payload.actorId) ||
        payload.actorId <= 0 ||
        !hasActiveSiteMembership(user, payload.fastSiteId) ||
        !hasActiveSiteMembership(actor, payload.fastSiteId))
    ) {
      throw new UnauthorizedException(
        'Fast session site access is no longer active',
      );
    }

    request['user'] = payload;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
