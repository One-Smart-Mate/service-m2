import { Controller, Get, Post, Put, Param, Body, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CiltSequencesService } from './ciltSequences.service';
import { CreateCiltSequenceDTO } from './models/dto/createCiltSequence.dto';
import { UpdateCiltSequenceDTO } from './models/dto/updateCiltSequence.dto';
import { UpdateSequenceOrderDTO } from './models/dto/update-order.dto';
import {
  PLATFORM_ADMIN_ROLE,
  SITE_ADMIN_ROLES,
} from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';
import { RequireSiteAccess } from 'src/common/decorators/require-site-access.decorator';
import { SiteResourceAccess } from 'src/common/decorators/site-resource-access.decorator';

@ApiTags('Cilt Sequences')
@ApiBearerAuth()
@Controller('cilt-sequences')
export class CiltSequencesController {
  constructor(private readonly ciltSequencesService: CiltSequencesService) {}

  @Get("/all")
  @RequireRoles(PLATFORM_ADMIN_ROLE)
  @ApiOperation({ summary: 'Get all CILT sequences' })
  async findAll() {
    return await this.ciltSequencesService.findAll();
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get all CILT sequences by site ID' })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site ID' })
  async findBySiteId(@Param('siteId') siteId: number) {
    return await this.ciltSequencesService.findBySiteId(siteId);
  }

  @Get('cilt/:ciltMstrId')
  @SiteResourceAccess({
    resource: 'ciltMaster',
    lookup: 'id',
    source: 'params',
    requestKey: 'ciltMstrId',
  })
  @ApiOperation({ summary: 'Get all CILT sequences by CILT master ID' })
  @ApiParam({ name: 'ciltMstrId', type: 'number', description: 'CILT master ID' })
  async findByCiltMstrId(@Param('ciltMstrId') ciltMstrId: number) {
    return await this.ciltSequencesService.findByCiltMstrId(ciltMstrId);
  }

  @Get(':id')
  @SiteResourceAccess({
    resource: 'ciltSequence',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Get a CILT sequence by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT sequence ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltSequencesService.findById(id);
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
      required: false,
    },
    {
      resource: 'ciltFrequency',
      lookup: 'id',
      source: 'body',
      requestKey: 'frecuencyId',
      required: false,
    },
    {
      resource: 'ciltType',
      lookup: 'id',
      source: 'body',
      requestKey: 'ciltTypeId',
      required: false,
    },
    {
      resource: 'oplMaster',
      lookup: 'id',
      source: 'body',
      requestKey: 'referenceOplSopId',
      required: false,
    },
    {
      resource: 'oplMaster',
      lookup: 'id',
      source: 'body',
      requestKey: 'remediationOplSopId',
      required: false,
    },
  )
  @ApiOperation({ summary: 'Create a new CILT sequence' })
  @ApiBody({ type: CreateCiltSequenceDTO })
  async create(@Body() createCiltSequenceDto: CreateCiltSequenceDTO) {
    return await this.ciltSequencesService.create(createCiltSequenceDto);
  }

  @Put("/update")
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess(
    {
      resource: 'ciltSequence',
      lookup: 'id',
      source: 'body',
      requestKey: 'id',
    },
    {
      resource: 'ciltMaster',
      lookup: 'id',
      source: 'body',
      requestKey: 'ciltMstrId',
      required: false,
    },
    {
      resource: 'ciltFrequency',
      lookup: 'id',
      source: 'body',
      requestKey: 'frecuencyId',
      required: false,
    },
    {
      resource: 'ciltType',
      lookup: 'id',
      source: 'body',
      requestKey: 'ciltTypeId',
      required: false,
    },
    {
      resource: 'oplMaster',
      lookup: 'id',
      source: 'body',
      requestKey: 'referenceOplSopId',
      required: false,
    },
    {
      resource: 'oplMaster',
      lookup: 'id',
      source: 'body',
      requestKey: 'remediationOplSopId',
      required: false,
    },
  )
  @ApiOperation({ summary: 'Update a CILT sequence' })
  @ApiBody({ type: UpdateCiltSequenceDTO })
  async update(@Body() updateCiltSequenceDto: UpdateCiltSequenceDTO) {
    return await this.ciltSequencesService.update(updateCiltSequenceDto);
  }

  @Put("/update-order")
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'ciltSequence',
    lookup: 'id',
    source: 'body',
    requestKey: 'sequenceId',
  })
  @ApiOperation({ summary: 'Update sequence order' })
  @ApiBody({ type: UpdateSequenceOrderDTO })
  async updateOrder(@Body() updateOrderDto: UpdateSequenceOrderDTO) {
    return await this.ciltSequencesService.updateOrder(updateOrderDto);
  }

  @Delete('/delete/:id')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'ciltSequence',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Delete a CILT sequence' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT sequence ID' })
  async delete(@Param('id') id: number) {
    return await this.ciltSequencesService.softDelete(id);
  }
  } 
