import { Controller, Get, Param } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserResponsible } from './models/user.responsible.dto';
import { plainToClass } from 'class-transformer';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/all/:siteId')
  @ApiParam({ name: 'siteId', example: 1 })
  FindAllBySiteId(@Param('siteId') siteId: number) {
    const users = this.usersService.findSiteUsers(siteId);
    return plainToClass(UserResponsible, users, {
      excludeExtraneousValues: true,
    });
  }
  @Get('/responsibles')
  FindAllResponsiblesData() {
    const users = this.usersService.findAllUsers();
    return plainToClass(UserResponsible, users, {
      excludeExtraneousValues: true,
    });
  }
}
