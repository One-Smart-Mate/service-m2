import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CiltFrequenciesService } from './ciltFrequencies.service';
import { CreateCiltFrequenciesDTO } from './models/dto/createCiltFrequencies.dto';
import { UpdateCiltFrequenciesDTO } from './models/dto/updateCiltFrequencies.dto';
import {
  PLATFORM_ADMIN_ROLE,
  SITE_ADMIN_ROLES,
} from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';
import { RequireSiteAccess } from 'src/common/decorators/require-site-access.decorator';
import { SiteResourceAccess } from 'src/common/decorators/site-resource-access.decorator';


@ApiTags('Cilt Frequencies')
@ApiBearerAuth()
@Controller('cilt-frequencies')
export class CiltFrequenciesController {
  constructor(private readonly ciltFrequenciesService: CiltFrequenciesService) {}

  @Get("/all")
  @RequireRoles(PLATFORM_ADMIN_ROLE)
  @ApiOperation({ summary: 'Get all CILT frequencies' })
  async findAll() {
    return await this.ciltFrequenciesService.findAll();
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get CILT frequencies by site ID' })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site ID' })
  async findBySiteId(@Param('siteId') siteId: number) {
    return await this.ciltFrequenciesService.findBySiteId(siteId);
  }

  @Get(':id')
  @SiteResourceAccess({
    resource: 'ciltFrequency',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Get a CILT frequency by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT frequency ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltFrequenciesService.findById(id);
  }

  @Post("/create")
  @RequireRoles(...SITE_ADMIN_ROLES)
  @RequireSiteAccess()
  @ApiOperation({ summary: 'Create a new CILT frequency' })
  @ApiBody({ type: CreateCiltFrequenciesDTO })
  async create(@Body() createCiltFrequencyDto: CreateCiltFrequenciesDTO) {
    return await this.ciltFrequenciesService.create(createCiltFrequencyDto);
  }

  @Put("/update")
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'ciltFrequency',
    lookup: 'id',
    source: 'body',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Update a CILT frequency' })
  @ApiBody({ type: UpdateCiltFrequenciesDTO })
  async update(@Body() updateCiltFrequencyDto: UpdateCiltFrequenciesDTO) {
    return await this.ciltFrequenciesService.update(updateCiltFrequencyDto);
  }
} 
