import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDTO } from './models/dto/login.dto';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserResponse } from '../users/models/user.response';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { SiteService } from '../site/site.service';
import { stringConstants } from 'src/utils/string.constant';
import { FastLoginDTO } from './models/dto/fast-login.dto';
import { UpdateLastLoginDTO } from './models/dto/update-last-login.dto';
import { RefreshTokenDTO } from './models/dto/refresh-token.dto';
import { PhoneNumberDTO } from './models/dto/phone-number.dto';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import {
  AuthTokenPayload,
  FAST_SESSION,
  FAST_SESSION_EXPIRES_IN,
  FAST_SESSION_TTL_MS,
  PRIMARY_SESSION,
} from './models/auth-token.payload';
import { randomUUID } from 'crypto';
import {
  AuthSessionService,
  CreateAuthSession,
} from '../auth-session/auth-session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersSevice: UsersService,
    private readonly siteService: SiteService,
    private readonly authSessionService: AuthSessionService,
  ) {}

  private async issueToken(
    payload: Omit<AuthTokenPayload, 'jti'>,
    options?: { expiresIn: string },
    parentSessionId?: string,
  ): Promise<string> {
    const sessionId = randomUUID();
    const token = await this.jwtService.signAsync(
      { ...payload, jti: sessionId },
      options,
    );
    const session: CreateAuthSession = {
      id: sessionId,
      userId: payload.id,
      actorId: payload.actorId,
      parentSessionId,
      sessionType: payload.sessionType,
      platform: payload.platform,
      expiresAt:
        payload.sessionType === FAST_SESSION
          ? new Date(Date.now() + FAST_SESSION_TTL_MS)
          : undefined,
    };

    if (payload.sessionType === FAST_SESSION) {
      const created = await this.authSessionService.createChildSession(
        session,
        parentSessionId,
        payload.actorId,
      );
      if (!created) {
        throw new UnauthorizedException('Primary session is no longer active');
      }
    } else {
      await this.authSessionService.createSession(session);
    }
    return token;
  }

  login = async (data: LoginDTO): Promise<UserResponse> => {
    try {
      const user = await this.usersSevice.findOneByEmail(data.email);

      if (!user) {
        throw new ValidationException(ValidationExceptionType.WRONG_AUTH);
      }

      if (
        user.status === stringConstants.inactiveStatus ||
        user.status === stringConstants.cancelledStatus
      ) {
        throw new ValidationException(ValidationExceptionType.USER_INACTIVE);
      }

      const isPasswordValid = await bcryptjs.compare(
        data.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new ValidationException(ValidationExceptionType.WRONG_AUTH);
      }

      const now = new Date();

      if (data.platform === stringConstants.OS_WEB) {
        user.lastLoginWeb = now;
      } else if (
        [stringConstants.OS_ANDROID, stringConstants.OS_IOS, 'app'].includes(
          data.platform,
        )
      ) {
        user.lastLoginApp = now;
      }

      await this.usersSevice.updateLastLogin(user);

      const roles = await this.usersSevice.getUserRoles(user.id);

      const payload: Omit<AuthTokenPayload, 'jti'> = {
        id: user.id,
        name: user.name,
        email: user.email,
        platform: data.platform,
        timezone: data.timezone,
        sessionType: PRIMARY_SESSION,
      };

      const access_token = await this.issueToken(payload);

      const companyName = await this.siteService.getCompanyName(
        user.userHasSites[0].site.companyId,
      );

      const site = user.userHasSites[0].site;
      const dueDate = new Date(site.dueDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const app_history = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return new UserResponse(
        user,
        access_token,
        roles,
        companyName,
        app_history,
      );
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };

  loginWithFastPassword = async (
    data: FastLoginDTO,
    userId: number,
    parentSessionId: string,
  ): Promise<UserResponse> => {
    try {
      const authUser = await this.usersSevice.findByIdWithSites(userId);
      if (!authUser || !authUser.userHasSites?.length) {
        throw new UnauthorizedException();
      }

      const siteId = authUser.userHasSites[0].site.id;

      const user = await this.usersSevice.findOneByFastPassword(
        data.fastPassword,
        siteId,
      );

      if (!user) {
        throw new UnauthorizedException();
      }

      if (
        user.status === stringConstants.inactiveStatus ||
        user.status === stringConstants.cancelledStatus
      ) {
        throw new ValidationException(ValidationExceptionType.USER_INACTIVE);
      }

      const now = new Date();

      if (data.platform === stringConstants.OS_WEB) {
        user.lastLoginWeb = now;
      } else if (
        [stringConstants.OS_ANDROID, stringConstants.OS_IOS, 'app'].includes(
          data.platform,
        )
      ) {
        user.lastLoginApp = now;
      }

      await this.usersSevice.updateLastLogin(user);

      const roles = await this.usersSevice.getUserRoles(user.id);

      const payload: Omit<AuthTokenPayload, 'jti'> = {
        id: user.id,
        name: user.name,
        email: user.email,
        platform: data.platform,
        timezone: data.timezone,
        sessionType: FAST_SESSION,
        actorId: userId,
      };

      const access_token = await this.issueToken(
        payload,
        { expiresIn: FAST_SESSION_EXPIRES_IN },
        parentSessionId,
      );

      const companyName = await this.siteService.getCompanyName(
        user.userHasSites[0].site.companyId,
      );

      const site = user.userHasSites[0].site;
      const dueDate = new Date(site.dueDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const app_history = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return new UserResponse(
        user,
        access_token,
        roles,
        companyName,
        app_history,
      );
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };

  updateLastLogin = async (
    data: UpdateLastLoginDTO,
    authenticatedUserId: number,
  ) => {
    try {
      const user = await this.usersSevice.findById(authenticatedUserId);

      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const loginDate = new Date(data.date);

      if (data.platform === stringConstants.OS_WEB) {
        user.lastLoginWeb = loginDate;
      } else if (
        [stringConstants.OS_ANDROID, stringConstants.OS_IOS, 'app'].includes(
          data.platform,
        )
      ) {
        user.lastLoginApp = loginDate;
      }

      await this.usersSevice.updateLastLogin(user);

      return {
        userId: user.id,
        platform: data.platform,
        lastLoginDate: loginDate,
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  refreshToken = async (
    data: RefreshTokenDTO,
    authenticatedUserId: number,
    currentSessionId: string,
  ) => {
    try {
      let payload: AuthTokenPayload;
      try {
        payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
          data.token,
        );
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }

      if (
        !payload?.id ||
        !payload.jti ||
        payload.jti !== currentSessionId ||
        Number(payload.id) !== Number(authenticatedUserId)
      ) {
        throw new UnauthorizedException(
          'Token does not belong to the active session',
        );
      }

      if (payload.sessionType === FAST_SESSION) {
        throw new UnauthorizedException('Fast sessions cannot be refreshed');
      }

      const user = await this.usersSevice.findByIdWithSites(payload.id);
      if (!user) {
        throw new ValidationException(ValidationExceptionType.WRONG_AUTH);
      }

      if (
        user.status === stringConstants.inactiveStatus ||
        user.status === stringConstants.cancelledStatus
      ) {
        throw new ValidationException(ValidationExceptionType.USER_INACTIVE);
      }

      if (!user.userHasSites?.length) {
        throw new UnauthorizedException('User has no site access');
      }

      const roles = await this.usersSevice.getUserRoles(user.id);

      const newSessionId = randomUUID();
      const newPayload: AuthTokenPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        platform: payload.platform || stringConstants.OS_WEB,
        timezone: payload.timezone || 'UTC',
        sessionType: PRIMARY_SESSION,
        jti: newSessionId,
      };

      const access_token = await this.jwtService.signAsync(newPayload);
      const rotated = await this.authSessionService.rotateSession(
        currentSessionId,
        user.id,
        {
          id: newSessionId,
          userId: user.id,
          sessionType: PRIMARY_SESSION,
          platform: newPayload.platform,
        },
      );
      if (!rotated) {
        throw new UnauthorizedException('Session is no longer active');
      }

      const companyName = await this.siteService.getCompanyName(
        user.userHasSites[0].site.companyId,
      );

      const site = user.userHasSites[0].site;
      const dueDate = new Date(site.dueDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const app_history = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return new UserResponse(
        user,
        access_token,
        roles,
        companyName,
        app_history,
      );
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  sendFastPasswordByPhone = async (data: PhoneNumberDTO) => {
    try {
      const user = await this.usersSevice.findOneByPhoneNumber(
        data.phoneNumber,
      );

      if (
        user &&
        user.status !== stringConstants.inactiveStatus &&
        user.status !== stringConstants.cancelledStatus &&
        user.phoneNumber
      ) {
        await this.usersSevice.rotateFastPasswordAndSend(user);
      }

      return {
        message: 'If the account exists, the fast password will be sent',
      };
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };
}
