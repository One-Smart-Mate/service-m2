import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
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
import { stringConstants } from 'src/utils/string.constant';
import { SendCodeEmailDto } from './models/send.code.email.dto';
@Controller('users')
@ApiTags('users')
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

  @Post('/send-code')
  @ApiBody({ type: SendCodeEmailDto })
  sendCodeToEmail(@Body() sendCodeEmailDto: SendCodeEmailDto) {
    return this.usersService.sendCodeToEmail(sendCodeEmailDto.email, sendCodeEmailDto.translation);
  }
  @Post('/verify-code')
  veryfyCode(@Body() sendCodeDTO: SendCodeDTO) {
    return this.usersService.verifyResetCode(sendCodeDTO);
  }
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
}
