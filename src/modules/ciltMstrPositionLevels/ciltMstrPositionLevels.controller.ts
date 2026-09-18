import { Controller, Get, Post, Put, Delete, Param, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CiltMstrPositionLevelsService } from './ciltMstrPositionLevels.service';
import { CreateCiltMstrPositionLevelsDto } from './model/create.ciltMstrPositionLevels.dto';
import { UpdateCiltMstrPositionLevelsDto } from './model/update.ciltMstrPositionLevels.dto';
import {
  PLATFORM_ADMIN_ROLE,
  SITE_ADMIN_ROLES,
} from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';
import { RequireSiteAccess } from 'src/common/decorators/require-site-access.decorator';
import { SiteResourceAccess } from 'src/common/decorators/site-resource-access.decorator';

@ApiTags('CILT Master Position Levels')
@ApiBearerAuth()
@Controller('cilt-mstr-position-levels')
export class CiltMstrPositionLevelsController {
  constructor(
    private readonly ciltMstrPositionLevelsService: CiltMstrPositionLevelsService,
  ) {}

  @Get("/all")
  @RequireRoles(PLATFORM_ADMIN_ROLE)
  @ApiOperation({ summary: 'Get all CILT Position Levels' })
  async findAll() {
    return await this.ciltMstrPositionLevelsService.findAll();
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get all CILT Position Levels by Site ID' })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site ID' })
  async findBySiteId(@Param('siteId') siteId: number) {
    return await this.ciltMstrPositionLevelsService.findBySiteId(siteId);
  }

  @Get('cilt-mstr/:ciltMstrId')
  @SiteResourceAccess({
    resource: 'ciltMaster',
    lookup: 'id',
    source: 'params',
    requestKey: 'ciltMstrId',
  })
  @ApiOperation({ summary: 'Get all CILT Position Levels by CILT Master ID' })
  @ApiParam({ name: 'ciltMstrId', type: 'number', description: 'CILT Master ID' })
  async findByCiltMstrId(@Param('ciltMstrId') ciltMstrId: number) {
    return await this.ciltMstrPositionLevelsService.findByCiltMstrId(ciltMstrId);
  }

  @Get('position/user')
  @ApiOperation({ summary: 'Get all CILT Position Levels for current user positions with executions from last 24 hours' })
  async findByUserPositionsWithRecentExecutions(@Request() req) {
    return await this.ciltMstrPositionLevelsService.findByUserIdWithRecentExecutions(req.user.id);
  }

  @Get('position/:positionId')
  @SiteResourceAccess({
    resource: 'position',
    lookup: 'id',
    source: 'params',
    requestKey: 'positionId',
  })
  @ApiOperation({ summary: 'Get all CILT Position Levels by Position ID' })
  @ApiParam({ name: 'positionId', type: 'number', description: 'Position ID' })
  async findByPositionId(@Param('positionId') positionId: number) {
    return await this.ciltMstrPositionLevelsService.findByPositionId(positionId);
  }

  @Get('level/:levelId')
  @SiteResourceAccess({
    resource: 'level',
    lookup: 'id',
    source: 'params',
    requestKey: 'levelId',
  })
  @ApiOperation({ summary: 'Get all CILT Position Levels by Level ID' })
  @ApiParam({ name: 'levelId', type: 'number', description: 'Level ID' })
  async findByLevelId(@Param('levelId') levelId: number) {
    return await this.ciltMstrPositionLevelsService.findByLevelId(levelId);
  }

  @Get('level/:levelId/recent-executions')
  @SiteResourceAccess({
    resource: 'level',
    lookup: 'id',
    source: 'params',
    requestKey: 'levelId',
  })
  @ApiOperation({ summary: 'Get all CILT Position Levels by Level ID with executions from last 24 hours' })
  @ApiParam({ name: 'levelId', type: 'number', description: 'Level ID' })
  async findByLevelIdWithRecentExecutions(@Param('levelId') levelId: number) {
    return await this.ciltMstrPositionLevelsService.findByLevelIdWithRecentExecutions(levelId);
  }

  @Get(':id')
  @SiteResourceAccess({
    resource: 'ciltPositionLevel',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Get a CILT Position Level by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT Position Level ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltMstrPositionLevelsService.findById(id);
  }

  @Post("/create")
  @RequireRoles(...SITE_ADMIN_ROLES)
  @RequireSiteAccess()
  @SiteResourceAccess(
    {
      resource: 'ciltMaster',
      lookup: 'id',
      source: 'body',
      requestKey: 'ciltMstrId',
    },
    {
      resource: 'position',
      lookup: 'id',
      source: 'body',
      requestKey: 'positionId',
    },
    {
      resource: 'level',
      lookup: 'id',
      source: 'body',
      requestKey: 'levelId',
    },
  )
  @ApiOperation({ summary: 'Create a new CILT Position Level' })
  @ApiBody({ type: CreateCiltMstrPositionLevelsDto })
  async create(@Body() createDto: CreateCiltMstrPositionLevelsDto) {
    return await this.ciltMstrPositionLevelsService.create(createDto);
  }

  @Put("/update")
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess(
    {
      resource: 'ciltPositionLevel',
      lookup: 'id',
      source: 'body',
      requestKey: 'id',
    },
    {
      resource: 'ciltMaster',
      lookup: 'id',
      source: 'body',
      requestKey: 'ciltMstrId',
    },
    {
      resource: 'position',
      lookup: 'id',
      source: 'body',
      requestKey: 'positionId',
    },
    {
      resource: 'level',
      lookup: 'id',
      source: 'body',
      requestKey: 'levelId',
    },
  )
  @ApiOperation({ summary: 'Update a CILT Position Level' })
  @ApiBody({ type: UpdateCiltMstrPositionLevelsDto })
  async update(@Body() updateDto: UpdateCiltMstrPositionLevelsDto) {
    return await this.ciltMstrPositionLevelsService.update(updateDto);
  }

  @Delete(':id')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'ciltPositionLevel',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Delete a CILT Position Level' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT Position Level ID' })
  async remove(@Param('id') id: number) {
    return await this.ciltMstrPositionLevelsService.remove(id);
  }

  @Delete('/delete/:id')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'ciltPositionLevel',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Delete a CILT Position Level' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT Position Level ID' })
  async delete(@Param('id') id: number) {
    return await this.ciltMstrPositionLevelsService.softDelete(id);
  }
}
