import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDTO } from './models/dto/login.dto';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ResestPasswordDTO } from './models/dto/reset.password.dto';
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
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersSevice: UsersService,
    private readonly siteService: SiteService,
  ) {}

  login = async (data: LoginDTO): Promise<UserResponse> => {
    try {
      const user = await this.usersSevice.findOneByEmail(data.email);

      if (!user) {
        throw new ValidationException(ValidationExceptionType.WRONG_AUTH);
      }

      if (user.status === stringConstants.inactiveStatus) {
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
      } else if ([stringConstants.OS_ANDROID, stringConstants.OS_IOS, 'app'].includes(data.platform)) {
        user.lastLoginApp = now;
      }
      
      await this.usersSevice.updateLastLogin(user);

      const roles = await this.usersSevice.getUserRoles(user.id);

      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        platform: data.platform,
        timezone: data.timezone,
      };

      const access_token = await this.jwtService.signAsync(payload);

      const companyName = await this.siteService.getCompanyName(
        user.userHasSites[0].site.companyId,
      );

      const site = user.userHasSites[0].site;
      const dueDate = new Date(site.dueDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const app_history = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return new UserResponse(user, access_token, roles, companyName, app_history);
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };

  loginWithFastPassword = async (data: FastLoginDTO, userId: number): Promise<UserResponse> => {
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

      if (user.status === stringConstants.inactiveStatus || user.status === stringConstants.cancelledStatus) {
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

      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        platform: data.platform,
        timezone: data.timezone,
      };

      const access_token = await this.jwtService.signAsync(payload);

      const companyName = await this.siteService.getCompanyName(
        user.userHasSites[0].site.companyId,
      );

      const site = user.userHasSites[0].site;
      const dueDate = new Date(site.dueDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const app_history = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return new UserResponse(user, access_token, roles, companyName, app_history);
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };

  resetPassword = async (data: ResestPasswordDTO, email: string) => {
    try {
      const user = await this.usersSevice.findOneByEmail(email);
      user.password = await bcryptjs.hash(data.newPassword, 10);
      this.usersSevice.update(user);

      const payload = { email: user.email };
      const access_token = await this.jwtService.signAsync(payload);

      return {
        access_token,
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  updateLastLogin = async (data: UpdateLastLoginDTO) => {
    try {
      const user = await this.usersSevice.findById(data.userId);

      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const loginDate = new Date(data.date);
      
      if (data.platform === stringConstants.OS_WEB) {
        user.lastLoginWeb = loginDate;
      } else if ([stringConstants.OS_ANDROID, stringConstants.OS_IOS, 'app'].includes(data.platform)) {
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

  refreshToken = async (data: RefreshTokenDTO) => {
    try {
      let payload;
      try {
        payload = await this.jwtService.verifyAsync(data.token);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          payload = this.jwtService.decode(data.token) as any;
          if (!payload || !payload.id) {
            throw new UnauthorizedException('Invalid token');
          }
        } else {  
          throw new UnauthorizedException('Invalid token');
        }
      }
        const user = await this.usersSevice.findOneByEmail(payload.email);
        if (!user) {
          throw new ValidationException(ValidationExceptionType.WRONG_AUTH);
        }

        if (user.status === stringConstants.inactiveStatus) {
          throw new ValidationException(ValidationExceptionType.USER_INACTIVE);
        }

        const roles = await this.usersSevice.getUserRoles(user.id);

        const newPayload = {
          id: user.id,
          name: user.name,
          email: user.email,
          platform: payload.platform || stringConstants.OS_WEB,
          timezone: payload.timezone || 'UTC',
        };

        const access_token = await this.jwtService.signAsync(newPayload);

        const companyName = await this.siteService.getCompanyName(
          user.userHasSites[0].site.companyId,
        );

        const site = user.userHasSites[0].site;
        const dueDate = new Date(site.dueDate);
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const app_history = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return new UserResponse(user, access_token, roles, companyName, app_history);
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };

  sendFastPasswordByPhone = async (data: PhoneNumberDTO) => {
    try {
      const user = await this.usersSevice.findOneByPhoneNumber(data.phoneNumber);

      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      if (user.status === stringConstants.inactiveStatus) {
        throw new ValidationException(ValidationExceptionType.USER_INACTIVE);
      }

      await this.usersSevice.sendFastPasswordWhatsApp(user.phoneNumber, user.fastPassword, user.translation);

      return {
        message: 'Fast password sent successfully',
        phoneNumber: user.phoneNumber
      };
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };

}
