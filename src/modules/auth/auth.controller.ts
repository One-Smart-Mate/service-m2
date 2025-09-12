import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './models/dto/login.dto';
import { AuthGuard } from './guard/auth.guard';
import { ResestPasswordDTO } from './models/dto/reset.password.dto';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { FastLoginDTO } from './models/dto/fast-login.dto';
import { UpdateLastLoginDTO } from './models/dto/update-last-login.dto';
import { RefreshTokenDTO } from './models/dto/refresh-token.dto';
import { PhoneNumberDTO } from './models/dto/phone-number.dto';
import { Public } from 'src/common/decorators/public.decorator';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
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

  @Public()
  @Post('reset-password')
  @ApiBody({ type: ResestPasswordDTO })
  resetPassword(@Body() resetPasswordDto: ResestPasswordDTO, @Request() req) {
    return this.authService.resetPassword(resetPasswordDto, req.user?.email);
  }

  @Post('update-last-login')
  @ApiBody({ type: UpdateLastLoginDTO })
  updateLastLogin(@Body() updateLastLoginDto: UpdateLastLoginDTO) {
    return this.authService.updateLastLogin(updateLastLoginDto);
  }

  @Post('refresh-token')
  @ApiBody({ type: RefreshTokenDTO })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDTO) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Public()
  @Post('send-fastpassword-by-phone')
  @ApiBody({ type: PhoneNumberDTO })
  sendFastPasswordByPhone(@Body() phoneNumberDto: PhoneNumberDTO) {
    return this.authService.sendFastPasswordByPhone(phoneNumberDto);
  }
}
