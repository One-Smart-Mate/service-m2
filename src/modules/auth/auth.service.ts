import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ResestPasswordDto } from './dto/resetPassword.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersSevice: UsersService,
  ) {}

  async login(data: LoginDto): Promise<{ access_token: string }> {
    const user = await this.usersSevice.findOneByEmail(data.email);
    if (!user) {
      throw new UnauthorizedException('Email does not exist');
    }

    const isPasswordValid = await bcryptjs.compare(
      data.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email or password wrong');
    }

    const payload = { email: user.email };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
    };
  }
  async resetPassword(data: ResestPasswordDto, email: string) {
    const user = await this.usersSevice.findOneByEmail(email);
    user.password = await bcryptjs.hash(data.newPassword, 10);
    this.usersSevice.update(user);

    const payload = { email: user.email };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
    };
  }
}
