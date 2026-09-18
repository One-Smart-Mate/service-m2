import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { OplTypesService } from './oplTypes.service';
import { CreateOplTypeDto } from './models/dto/createOplType.dto';
import { UpdateOplTypeDto } from './models/dto/updateOplType.dto';
import {
  PLATFORM_ADMIN_ROLE,
  SITE_ADMIN_ROLES,
} from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';
import { SiteResourceAccess } from 'src/common/decorators/site-resource-access.decorator';

@ApiTags('Opl Types')
@ApiBearerAuth()
@Controller('opl-types')
export class OplTypesController {
  constructor(private readonly oplTypesService: OplTypesService) {}

  @Get("/all")
  @RequireRoles(PLATFORM_ADMIN_ROLE)
  @ApiOperation({ summary: 'Get all OPL types' })
  @ApiResponse({ status: 200, description: 'List of OPL types'})
  async findAll() {
    return await this.oplTypesService.findAll();
  }

  @Get('/site/:siteId')
  @ApiOperation({ summary: 'Get all OPL types by site ID' })
  @ApiParam({ name: 'siteId', required: true, example: 1 })
  @ApiResponse({ status: 200, description: 'List of OPL types for the specified site'})
  async findBySite(@Param('siteId') siteId: number) {
    return await this.oplTypesService.findBySite(siteId);
  }

  @Get(':id')
  @SiteResourceAccess({
    resource: 'oplType',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Get an OPL type by ID' })
  @ApiResponse({ status: 200, description: 'OPL type found'})
  @ApiResponse({ status: 404, description: 'OPL type not found' })
  async findById(@Param('id') id: number) {
    return await this.oplTypesService.findById(id);
  }

  @Post("/create")
  @RequireRoles(...SITE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Create a new OPL type' })
  @ApiResponse({ status: 201, description: 'OPL type created successfully'})
  async create(@Body() createOplDto: CreateOplTypeDto) {
    return await this.oplTypesService.create(createOplDto);
  }

  @Put("/update")
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'oplType',
    lookup: 'id',
    source: 'body',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Update an OPL type' })
  @ApiResponse({ status: 200, description: 'OPL type updated successfully'})
  @ApiResponse({ status: 404, description: 'OPL type not found' })
  async update(@Body() updateOplDto: UpdateOplTypeDto) {
    return await this.oplTypesService.update(updateOplDto);
  }

  @Delete(':id')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'oplType',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Delete an OPL type (soft delete)' })
  @ApiParam({ name: 'id', type: 'number', description: 'OPL type ID' })
  @ApiResponse({ status: 200, description: 'OPL type deleted successfully'})
  @ApiResponse({ status: 404, description: 'OPL type not found' })
  async delete(@Param('id') id: number) {
    return await this.oplTypesService.softDelete(id);
  }
}
