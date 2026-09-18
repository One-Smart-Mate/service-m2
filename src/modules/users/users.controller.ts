import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiParam,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserResponsible } from './models/user.responsible.dto';
import { plainToClass } from 'class-transformer';
import { CreateUserDTO } from './models/create.user.dto';
import { UpdateUserDTO } from './models/update.user.dto';
import { SendCodeDTO } from './models/send.code.dto';
import { ResetPasswordDTO } from './models/reset.password.dto';
import { SetAppTokenDTO } from './models/set.app.token.dto';
import { PositionResponseDTO } from './models/position.response.dto';
import { ApiOkResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { LogoutDTO } from './models/logout.dto';
import { SendCodeEmailDto } from './models/send.code.email.dto';
import { UserWithPositionsResponseDTO } from './models/user.with.positions.response.dto';
import { UpdateUserPartialDTO } from './models/update-user-partial.dto';
import { Public } from '../../common/decorators/public.decorator';
import {
  PLATFORM_ADMIN_ROLE,
  SITE_ADMIN_ROLES,
} from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';
import { SelfOrRoles } from 'src/common/decorators/self-or-roles.decorator';
import { SiteResourceAccess } from 'src/common/decorators/site-resource-access.decorator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  AUTH_THROTTLE,
  getAuthThrottleTracker,
} from 'src/common/auth/auth-throttle';
import { FAST_SESSION } from '../auth/models/auth-token.payload';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/all/:siteId')
  @ApiParam({ name: 'siteId', example: 1 })
  findAllBySiteIdResponsibleData(@Param('siteId') siteId: number) {
    const users = this.usersService.findSiteUsersResponsibleData(siteId);
    return plainToClass(UserResponsible, users, {
      excludeExtraneousValues: true,
    });
  }
  @Get('/all')
  @RequireRoles(PLATFORM_ADMIN_ROLE)
  findAll() {
    return this.usersService.findAllUsers();
  }

  @Get('/site/:siteId')
  @ApiParam({ name: 'siteId', example: 1 })
  findSiteUsers(@Param('siteId') siteId: number) {
    return this.usersService.findSiteUsers(siteId);
  }

  @Post('/create')
  @RequireRoles(...SITE_ADMIN_ROLES)
  create(@Body() createUserDTO: CreateUserDTO) {
    return this.usersService.create(createUserDTO);
  }

  @Public()
  @Post('/send-code')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      ...AUTH_THROTTLE.recoverySend,
      getTracker: getAuthThrottleTracker,
    },
  })
  @ApiBody({ type: SendCodeEmailDto })
  async sendCodeToEmail(@Body() sendCodeEmailDto: SendCodeEmailDto) {
    await this.usersService.sendCodeToEmail(
      sendCodeEmailDto.email,
      sendCodeEmailDto.translation,
    );
    return {
      message: 'If the account exists, a recovery code will be sent',
    };
  }
  @Public()
  @Post('/verify-code')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      ...AUTH_THROTTLE.recoveryVerify,
      getTracker: getAuthThrottleTracker,
    },
  })
  veryfyCode(@Body() sendCodeDTO: SendCodeDTO) {
    return this.usersService.verifyResetCode(sendCodeDTO);
  }
  @Public()
  @Post('/reset-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      ...AUTH_THROTTLE.recoveryReset,
      getTracker: getAuthThrottleTracker,
    },
  })
  async resetPassword(@Body() resetPasswordDTO: ResetPasswordDTO) {
    await this.usersService.resetPassword(resetPasswordDTO);
  }

  @Get('/user/:userId')
  @SelfOrRoles({
    source: 'params',
    requestKey: 'userId',
    roles: SITE_ADMIN_ROLES,
  })
  @SiteResourceAccess({
    resource: 'user',
    lookup: 'id',
    source: 'params',
    requestKey: 'userId',
  })
  findOneById(@Param('userId') userId: number) {
    return this.usersService.findOneById(userId);
  }

  @Put('/update')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'user',
    lookup: 'id',
    source: 'body',
    requestKey: 'id',
  })
  update(@Body() updateUserDTO: UpdateUserDTO) {
    return this.usersService.updateUser(updateUserDTO);
  }

  @Put('/update-partial')
  @SelfOrRoles({
    source: 'body',
    requestKey: 'id',
    roles: SITE_ADMIN_ROLES,
  })
  @SiteResourceAccess({
    resource: 'user',
    lookup: 'id',
    source: 'body',
    requestKey: 'id',
  })
  @ApiOperation({
    summary: 'Update user partially (name, email, password, fastPassword)',
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  updatePartial(@Body() updateUserPartialDTO: UpdateUserPartialDTO) {
    return this.usersService.updateUserPartial(updateUserPartialDTO);
  }

  @Post('/app-token')
  @SelfOrRoles({ source: 'body', requestKey: 'userId' })
  @SiteResourceAccess({
    resource: 'user',
    lookup: 'id',
    source: 'body',
    requestKey: 'userId',
  })
  setUserAppToken(@Body() setAppTokenDTO: SetAppTokenDTO) {
    return this.usersService.firebaseAppToken(setAppTokenDTO);
  }

  @Get('site/mechanics/:siteId')
  findSiteMechanics(@Param('siteId') siteId: number) {
    const users = this.usersService.findSiteMechanics(siteId);
    return plainToClass(UserResponsible, users, {
      excludeExtraneousValues: true,
    });
  }

  @Get('/site/:siteId/role/:roleName')
  @ApiParam({ name: 'siteId', type: 'number', description: 'ID del sitio' })
  @ApiParam({
    name: 'roleName',
    type: 'string',
    description: 'Nombre del rol (Ejemplo: mechanic, external_provider)',
  })
  async getUsersByRole(
    @Param('siteId') siteId: string,
    @Param('roleName') roleName: string,
  ) {
    const users = await this.usersService.findUsersByRole(
      parseInt(siteId),
      roleName,
    );
    return users;
  }
  @Post('/logout')
  logout(@Body() logoutDTO: LogoutDTO, @Request() req) {
    if (req.user.sessionType === FAST_SESSION) {
      throw new ForbiddenException(
        'Fast sessions cannot close the primary session',
      );
    }

    return this.usersService.logout(req.user.id, logoutDTO.osName);
  }
  @Get('/:userId/positions')
  @SelfOrRoles({
    source: 'params',
    requestKey: 'userId',
    roles: SITE_ADMIN_ROLES,
  })
  @SiteResourceAccess({
    resource: 'user',
    lookup: 'id',
    source: 'params',
    requestKey: 'userId',
  })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiOkResponse({ type: [PositionResponseDTO] })
  getUserPositions(@Param('userId') userId: number) {
    return this.usersService.findPositionsByUserId(+userId);
  }

  @Get('/site/:siteId/positions')
  @ApiParam({ name: 'siteId', type: 'number' })
  @ApiOkResponse({ type: [UserWithPositionsResponseDTO] })
  getUsersBySiteWithPositions(@Param('siteId') siteId: number) {
    return this.usersService.findUsersBySiteWithPositions(+siteId);
  }

  @Get('/site/:siteId/roles')
  @ApiOperation({ summary: 'Get users by site with roles' })
  @ApiParam({ name: 'siteId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  async findUsersBySiteWithRoles(@Param('siteId') siteId: number) {
    return this.usersService.findUsersBySiteWithRoles(siteId);
  }

  @Get('/preferences/:siteId')
  @ApiOperation({
    summary: 'Get user preferences including card count for a site',
  })
  @ApiParam({ name: 'siteId', description: 'Site ID' })
  @ApiResponse({
    status: 200,
    description: 'Preferences retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User does not have access to the site',
  })
  @ApiResponse({ status: 404, description: 'Site not found' })
  preferences(@Param('siteId') siteId: number, @Request() req) {
    return this.usersService.preferences(siteId, req.user.id);
  }
}
