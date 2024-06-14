import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';

@Controller('roles')
@ApiTags('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('/all')
  findAllRoles() {
    return this.rolesService.findAll();
  }
}
