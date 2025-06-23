import {
  Body,
  Controller,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './models/dto/login.dto';
import { AuthGuard } from './guard/auth.guard';
import { ResestPasswordDTO } from './models/dto/reset.password.dto';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { FastLoginDTO } from './models/dto/fast-login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiBody({ type: LoginDTO })
  login(@Body() loginDto: LoginDTO) {
    return this.authService.login(loginDto);
  }

  @Post('login-fast')
  @ApiBody({ type: FastLoginDTO })
  loginWithFastPassword(@Body() fastLoginDto: FastLoginDTO) {
    return this.authService.loginWithFastPassword(fastLoginDto);
  }

  @ApiBearerAuth()
  @Post('reset-password')
  @UseGuards(AuthGuard)
  @ApiBody({ type: ResestPasswordDTO })
  resetPassword(@Body() resetPasswordDto: ResestPasswordDTO, @Request() req) {
    return this.authService.resetPassword(resetPasswordDto, req.user?.email);
  }
}
