import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDTO } from './models/dto/login.dto';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ResestPasswordDTO } from './models/dto/resetPassword.dto';
import { UsersService } from '../users/users.service';
import { stringConstants } from '../../utils/string.constant';
import { UserResponse } from '../users/models/user.response';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersSevice: UsersService,
  ) {}

  login = async (data: LoginDTO): Promise<UserResponse> => {
    const user = await this.usersSevice.findOneByEmail(data.email);
    if (!user) {
      throw new UnauthorizedException(stringConstants.nonexistentEmail);
    }

    const isPasswordValid = await bcryptjs.compare(
      data.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(stringConstants.wrongAuth);
    }

    const roles = await this.usersSevice.getUserRoles(user.id);

    const payload = { id: user.id, name: user.name, email: user.email };

    const access_token = await this.jwtService.signAsync(payload);

    return new UserResponse(user, access_token, roles);
  };
  resetPassword = async (data: ResestPasswordDTO, email: string) => {
    const user = await this.usersSevice.findOneByEmail(email);
    user.password = await bcryptjs.hash(data.newPassword, 10);
    this.usersSevice.update(user);

    const payload = { email: user.email };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
    };
  };
}
