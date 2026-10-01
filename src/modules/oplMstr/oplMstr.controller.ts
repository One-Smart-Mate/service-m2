import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OplMstrService } from './oplMstr.service';
import { CreateOplMstrDTO } from './models/dto/createOplMstr.dto';
import { UpdateOplMstrDTO } from './models/dto/updateOplMstr.dto';
import { UpdateOplMstrOrderDTO } from './models/dto/update-order.dto';
import {
  PLATFORM_ADMIN_ROLE,
  SITE_ADMIN_ROLES,
} from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';
import { SelfOrRoles } from 'src/common/decorators/self-or-roles.decorator';
import { SiteResourceAccess } from 'src/common/decorators/site-resource-access.decorator';
import { SearchOplDTO } from './models/dto/searchOpl.dto';

@ApiTags('Opl Master')
@ApiBearerAuth()
@Controller('opl-mstr')
export class OplMstrController {
  constructor(private readonly oplMstrService: OplMstrService) {}

  @Get('/all')
  @RequireRoles(PLATFORM_ADMIN_ROLE)
  @ApiOperation({ summary: 'Get all OPLs' })
  @ApiResponse({ status: 200, description: 'List of OPLs' })
  async findAll() {
    return await this.oplMstrService.findAll();
  }

  @Get('creator/:creatorId')
  @SelfOrRoles({
    source: 'params',
    requestKey: 'creatorId',
    roles: SITE_ADMIN_ROLES,
  })
  @SiteResourceAccess({
    resource: 'user',
    lookup: 'id',
    source: 'params',
    requestKey: 'creatorId',
  })
  @ApiOperation({ summary: 'Get all OPLs by creator ID' })
  @ApiParam({ name: 'creatorId', type: 'number', description: 'Creator ID' })
  @ApiResponse({ status: 200, description: 'List of OPLs created by the user' })
  async findByCreatorId(@Param('creatorId') creatorId: number) {
    return await this.oplMstrService.findByCreatorId(creatorId);
  }

  @Get('site/:siteId/search')
  @SiteResourceAccess({
    resource: 'site',
    lookup: 'id',
    source: 'params',
    requestKey: 'siteId',
  })
  @ApiOperation({
    summary: 'Search OPLs by OPL title or assigned level name within a site',
  })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site ID' })
  @ApiQuery({
    name: 'query',
    type: 'string',
    description: 'Partial OPL title or level/machine name',
  })
  @ApiResponse({
    status: 200,
    description: 'Matching OPLs with their content and assigned levels',
  })
  async searchByTitleOrLevelName(
    @Param('siteId', ParseIntPipe) siteId: number,
    @Query() searchOplDto: SearchOplDTO,
  ) {
    return await this.oplMstrService.searchByTitleOrLevelName(
      siteId,
      searchOplDto.query,
    );
  }

  @Get('site/:siteId')
  @SiteResourceAccess({
    resource: 'site',
    lookup: 'id',
    source: 'params',
    requestKey: 'siteId',
  })
  @ApiOperation({ summary: 'Get all OPLs by site ID' })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site ID' })
  @ApiResponse({
    status: 200,
    description: 'List of OPLs associated with the site',
  })
  async findBySiteId(@Param('siteId', ParseIntPipe) siteId: number) {
    return await this.oplMstrService.findOplMstrBySiteId(siteId);
  }

  @Get(':id')
  @SiteResourceAccess({
    resource: 'oplMaster',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Get an OPL by ID' })
  @ApiResponse({ status: 200, description: 'OPL found' })
  @ApiResponse({ status: 404, description: 'OPL not found' })
  async findById(@Param('id') id: number) {
    return await this.oplMstrService.findById(id);
  }

  @Post('/create')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'oplType',
    lookup: 'id',
    source: 'body',
    requestKey: 'oplTypeId',
    required: false,
  })
  @ApiOperation({ summary: 'Create a new OPL' })
  @ApiResponse({ status: 201, description: 'OPL created successfully' })
  async create(@Body() createOplDto: CreateOplMstrDTO, @Request() req: any) {
    return await this.oplMstrService.create(createOplDto, req.user.id);
  }

  @Put('/update')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess(
    {
      resource: 'oplMaster',
      lookup: 'id',
      source: 'body',
      requestKey: 'id',
    },
    {
      resource: 'oplType',
      lookup: 'id',
      source: 'body',
      requestKey: 'oplTypeId',
      required: false,
    },
  )
  @ApiOperation({ summary: 'Update an OPL' })
  @ApiResponse({ status: 200, description: 'OPL updated successfully' })
  @ApiResponse({ status: 404, description: 'OPL not found' })
  async update(@Body() updateOplDto: UpdateOplMstrDTO) {
    return await this.oplMstrService.update(updateOplDto);
  }

  @Put('/update-order')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'oplMaster',
    lookup: 'id',
    source: 'body',
    requestKey: 'oplId',
  })
  @ApiOperation({ summary: 'Update OPL order' })
  @ApiResponse({ status: 200, description: 'OPL order updated successfully' })
  @ApiResponse({ status: 404, description: 'OPL not found' })
  async updateOrder(@Body() updateOrderDto: UpdateOplMstrOrderDTO) {
    return await this.oplMstrService.updateOrder(updateOrderDto);
  }

  @Delete(':id')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'oplMaster',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Delete an OPL master (soft delete)' })
  @ApiParam({ name: 'id', type: 'number', description: 'OPL master ID' })
  @ApiResponse({ status: 200, description: 'OPL master deleted successfully' })
  @ApiResponse({ status: 404, description: 'OPL master not found' })
  async delete(@Param('id') id: number) {
    return await this.oplMstrService.delete(id);
  }
}
