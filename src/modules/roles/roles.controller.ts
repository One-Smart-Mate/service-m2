import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDTO } from './models/create.role.dto';

@Controller('roles')
@ApiTags('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('/all')
  findAllRoles() {
    return this.rolesService.findAll();
  }

  @Post('/create')
  create(@Body() createRoleDTO: CreateRoleDTO){
    return this.rolesService.create(createRoleDTO)
  }
}
