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
import { stringConstants } from './constants/string.constant';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersSevice: UsersService,
  ) {}

  login = async (data: LoginDTO): Promise<{ access_token: string }> => {
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

    const payload = { email: user.email };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
    };
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
