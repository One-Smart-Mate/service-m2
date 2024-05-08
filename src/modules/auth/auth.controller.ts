import {
  Body,
  Controller,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guard/auth.guard';
import { ResestPasswordDto } from './dto/resetPassword.dto';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiBody({ type: LoginDto })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiBearerAuth()
  @Post('reset-password')
  @UseGuards(AuthGuard)
  @ApiBody({ type: ResestPasswordDto })
  resetPassword(@Body() resetPasswordDto: ResestPasswordDto, @Request() req) {
    return this.authService.resetPassword(resetPasswordDto, req.user?.email);
  }
}
