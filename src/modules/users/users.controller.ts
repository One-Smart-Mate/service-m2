import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserResponsible } from './models/user.responsible.dto';
import { plainToClass } from 'class-transformer';
import { CreateUserDTO } from './models/create.user.dto';
import { UpdateUserDTO } from './models/update.user.dto';
import { SendCodeDTO } from './models/send.code.dto';
import { ResetPasswordDTO } from './models/reset.password.dto';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/all/:siteId')
  @ApiParam({ name: 'siteId', example: 1 })
  findAllBySiteId(@Param('siteId') siteId: number) {
    const users = this.usersService.findSiteUsers(siteId);
    return plainToClass(UserResponsible, users, {
      excludeExtraneousValues: true,
    });
  }
  @Get('/all')
  findAll() {
    return this.usersService.findAllUsers();
  }

  @Post('/create')
  create(@Body() createUserDTO: CreateUserDTO) {
    return this.usersService.create(createUserDTO);
  }

  @Post('/send-code')
  sendCodeToEmail(@Body('email') email: string) {
    return this.usersService.sendCodeToEmail(email);
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
}
