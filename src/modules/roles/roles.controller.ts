import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDTO } from './models/create.role.dto';
import { UpdateRoleDTO } from './models/update.role.dto';

@Controller('roles')
@ApiTags('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('/all')
  findAllRoles() {
    return this.rolesService.findAll();
  }

  @Get('/role/:roleId')
  findOneRoleById(@Param('roleId') roleId: number) {
    return this.rolesService.findOneById(roleId);
  }

  @Put('/update')
  update(@Body() updateRoleDTO: UpdateRoleDTO){
    return this.rolesService.update(updateRoleDTO)
  }

  @Post('/create')
  create(@Body() createRoleDTO: CreateRoleDTO){
    return this.rolesService.create(createRoleDTO)
  }
}
