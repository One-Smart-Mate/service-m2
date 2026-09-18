import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OplLevelsService } from './oplLevels.service';
import { CreateOplLevelsDTO } from './models/create-opl-levels.dto';
import { SITE_ADMIN_ROLES } from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';
import { RequireSiteAccess } from 'src/common/decorators/require-site-access.decorator';
import { SiteResourceAccess } from 'src/common/decorators/site-resource-access.decorator';

@ApiTags('opl-levels')
@ApiBearerAuth()
@Controller('opl-levels')
export class OplLevelsController {
  constructor(private readonly oplLevelsService: OplLevelsService) {}

  @Post()
  @RequireRoles(...SITE_ADMIN_ROLES)
  @RequireSiteAccess()
  @SiteResourceAccess(
    {
      resource: 'oplMaster',
      lookup: 'id',
      source: 'body',
      requestKey: 'oplId',
    },
    {
      resource: 'level',
      lookup: 'id',
      source: 'body',
      requestKey: 'levelId',
    },
  )
  @ApiOperation({ summary: 'Make a new OPL level relation' })
  @ApiResponse({ status: 201, description: 'Relation created correctly' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  create(@Body() createOplLevelsDTO: CreateOplLevelsDTO) {
    return this.oplLevelsService.create(createOplLevelsDTO);
  }

  @Get('level/:levelId')
  @SiteResourceAccess({
    resource: 'level',
    lookup: 'id',
    source: 'params',
    requestKey: 'levelId',
  })
  @ApiOperation({ summary: 'Get all OPLs by level ID' })
  @ApiParam({ name: 'levelId', type: 'number', description: 'Level ID' })
  @ApiResponse({ status: 200, description: 'List of OPLs associated with the level'})
  async findByLevelId(@Param('levelId') levelId: number) {
    return await this.oplLevelsService.findOplMstrByLevelId(levelId);
  }

  @Delete(':id')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'oplLevel',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Delete a relation (soft delete)' })
  @ApiResponse({ status: 200, description: 'Relation deleted correctly' })
  @ApiResponse({ status: 404, description: 'Relation not found' })
  remove(@Param('id') id: number) {
    return this.oplLevelsService.remove(id);
  }
}
