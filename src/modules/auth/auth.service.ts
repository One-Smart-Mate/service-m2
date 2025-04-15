import {
  BadRequestException,
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

      const isPasswordValid = await bcryptjs.compare(
        data.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new ValidationException(ValidationExceptionType.WRONG_AUTH);
      }

      const roles = await this.usersSevice.getUserRoles(user.id);

      const payload = { id: user.id, name: user.name, email: user.email };

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
}
