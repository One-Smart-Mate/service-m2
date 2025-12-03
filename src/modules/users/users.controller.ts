import { Body, Controller, Get, Param, Post, Put, Request } from '@nestjs/common';
import { ApiBody, ApiParam, ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
  findAll() {
    return this.usersService.findAllUsers();
  }

  @Get('/site/:siteId')
  @ApiParam({ name: 'siteId', example: 1 })
  findSiteUsers(@Param('siteId') siteId: number) {
    return this.usersService.findSiteUsers(siteId);
  }

  @Post('/create')
  create(@Body() createUserDTO: CreateUserDTO) {
    return this.usersService.create(createUserDTO);
  }

  @Public()
  @Post('/send-code')
  @ApiBody({ type: SendCodeEmailDto })
  sendCodeToEmail(@Body() sendCodeEmailDto: SendCodeEmailDto) {
    return this.usersService.sendCodeToEmail(sendCodeEmailDto.email, sendCodeEmailDto.translation);
  }
  @Public()
  @Post('/verify-code')
  veryfyCode(@Body() sendCodeDTO: SendCodeDTO) {
    return this.usersService.verifyResetCode(sendCodeDTO);
  }
  @Public()
  @Post('/reset-password')
  async resetPassword(@Body() resetPasswordDTO: ResetPasswordDTO) {
    await this.usersService.resetPassword(resetPasswordDTO);
  }

  @Get('/user/:userId')
  findOneById(@Param('userId') userId: number) {
    return this.usersService.findOneById(userId);
  }

  @Put('/update')
  update(@Body() updateUserDTO: UpdateUserDTO) {
    return this.usersService.updateUser(updateUserDTO);
  }

  @Put('/update-partial')
  @ApiOperation({ summary: 'Update user partially (name, email, password, fastPassword)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  updatePartial(@Body() updateUserPartialDTO: UpdateUserPartialDTO) {
    return this.usersService.updateUserPartial(updateUserPartialDTO);
  }

  @Post('/app-token')
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
  @Public()
  @Post('/logout')
  logout(@Body() logoutDTO: LogoutDTO) {
    return this.usersService.logout(logoutDTO.userId, logoutDTO.osName);
  }
  @Get('/:userId/positions')
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
  @ApiOperation({ summary: 'Get user preferences including card count for a site' })
  @ApiParam({ name: 'siteId', description: 'Site ID' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - User does not have access to the site' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  preferences(@Param('siteId') siteId: number, @Request() req) {
    return this.usersService.preferences(siteId, req.user.id);
  }
}
