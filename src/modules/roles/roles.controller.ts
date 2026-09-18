import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDTO } from './models/create.role.dto';
import { UpdateRoleDTO } from './models/update.role.dto';
import {
  PLATFORM_ADMIN_ROLE,
  SITE_ADMIN_ROLES,
} from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';

@Controller('roles')
@ApiTags('roles')
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('/all')
  @RequireRoles(...SITE_ADMIN_ROLES)
  findAllRoles() {
    return this.rolesService.findAll();
  }

  @Get('/role/:roleId')
  @RequireRoles(...SITE_ADMIN_ROLES)
  findOneRoleById(@Param('roleId') roleId: number) {
    return this.rolesService.findOneById(roleId);
  }

  @Put('/update')
  @RequireRoles(PLATFORM_ADMIN_ROLE)
  update(@Body() updateRoleDTO: UpdateRoleDTO){
    return this.rolesService.update(updateRoleDTO)
  }

  @Post('/create')
  @RequireRoles(PLATFORM_ADMIN_ROLE)
  create(@Body() createRoleDTO: CreateRoleDTO){
    return this.rolesService.create(createRoleDTO)
  }
}
