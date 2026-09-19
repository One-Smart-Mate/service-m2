import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './models/dto/login.dto';
import { AuthGuard } from './guard/auth.guard';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { FastLoginDTO } from './models/dto/fast-login.dto';
import { UpdateLastLoginDTO } from './models/dto/update-last-login.dto';
import { RefreshTokenDTO } from './models/dto/refresh-token.dto';
import { PhoneNumberDTO } from './models/dto/phone-number.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  AUTH_THROTTLE,
  getAuthThrottleTracker,
} from 'src/common/auth/auth-throttle';

@ApiBearerAuth()
@UseGuards(AuthGuard, ThrottlerGuard)
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({
    default: { ...AUTH_THROTTLE.login, getTracker: getAuthThrottleTracker },
  })
  @ApiBody({ type: LoginDTO })
  login(@Body() loginDto: LoginDTO) {
    return this.authService.login(loginDto);
  }

  @Post('login-fast')
  @Throttle({
    default: {
      ...AUTH_THROTTLE.fastLogin,
      getTracker: getAuthThrottleTracker,
    },
  })
  @ApiBody({ type: FastLoginDTO })
  loginWithFastPassword(@Body() fastLoginDto: FastLoginDTO, @Request() req) {
    return this.authService.loginWithFastPassword(
      fastLoginDto,
      req.user.id,
      req.user.jti,
    );
  }

  @Post('update-last-login')
  @ApiBody({ type: UpdateLastLoginDTO })
  updateLastLogin(
    @Body() updateLastLoginDto: UpdateLastLoginDTO,
    @Request() req,
  ) {
    return this.authService.updateLastLogin(updateLastLoginDto, req.user.id);
  }

  @Post('refresh-token')
  @ApiBody({ type: RefreshTokenDTO })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDTO, @Request() req) {
    return this.authService.refreshToken(
      refreshTokenDto,
      req.user.id,
      req.user.jti,
    );
  }

  @Public()
  @Post('send-fastpassword-by-phone')
  @Throttle({
    default: {
      ...AUTH_THROTTLE.recoverySend,
      getTracker: getAuthThrottleTracker,
    },
  })
  @ApiBody({ type: PhoneNumberDTO })
  sendFastPasswordByPhone(@Body() phoneNumberDto: PhoneNumberDTO) {
    return this.authService.sendFastPasswordByPhone(phoneNumberDto);
  }
}
