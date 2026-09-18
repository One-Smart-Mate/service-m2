import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CiltSecuencesScheduleService } from './ciltSecuencesSchedule.service';
import { CreateCiltSecuencesScheduleDto } from './models/dto/create.ciltSecuencesSchedule.dto';
import { UpdateCiltSecuencesScheduleDto } from './models/dto/update.ciltSecuencesSchedule.dto';
import { UpdateScheduleOrderDTO } from './models/dto/update-order.dto';
import {
  PLATFORM_ADMIN_ROLE,
  SITE_ADMIN_ROLES,
} from 'src/common/auth/roles.constants';
import { RequireRoles } from 'src/common/decorators/roles.decorator';
import { RequireSiteAccess } from 'src/common/decorators/require-site-access.decorator';
import { SiteResourceAccess } from 'src/common/decorators/site-resource-access.decorator';

@ApiTags('CILT Secuences Schedule')
@ApiBearerAuth()
@Controller('cilt-secuences-schedule')
export class CiltSecuencesScheduleController {
  constructor(private readonly ciltSecuencesScheduleService: CiltSecuencesScheduleService) {}

  @Get("/all")
  @RequireRoles(PLATFORM_ADMIN_ROLE)
  @ApiOperation({ summary: 'Get all active schedules' })
  async findAll() {
    return await this.ciltSecuencesScheduleService.findActiveSchedules();
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get all schedules by site ID' })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site ID' })
  async findBySiteId(@Param('siteId') siteId: number) {
    return await this.ciltSecuencesScheduleService.findBySiteId(siteId);
  }

  @Get('cilt/:ciltId')
  @SiteResourceAccess({
    resource: 'ciltMaster',
    lookup: 'id',
    source: 'params',
    requestKey: 'ciltId',
  })
  @ApiOperation({ summary: 'Get all schedules by CILT ID' })
  @ApiParam({ name: 'ciltId', type: 'number', description: 'CILT ID' })
  async findByCiltId(@Param('ciltId') ciltId: number) {
    return await this.ciltSecuencesScheduleService.findByCiltId(ciltId);
  }

  @Get(':id')
  @SiteResourceAccess({
    resource: 'ciltSchedule',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Get a schedule by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Schedule ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltSecuencesScheduleService.findById(id);
  }

  @Get('date/:date')
  @RequireRoles(PLATFORM_ADMIN_ROLE)
  @ApiOperation({ summary: 'Get schedules for a specific date' })
  @ApiParam({ name: 'date', type: 'string', description: 'Date in format YYYY-MM-DD' })
  async findSchedulesForDate(@Param('date') date: string) {
    return await this.ciltSecuencesScheduleService.findSchedulesForDate(date);
  }

  @Get('date-simplified/:date')
  @RequireRoles(PLATFORM_ADMIN_ROLE)
  @ApiOperation({ summary: 'Get simplified schedules for a specific date (id, siteId, ciltId, secuenceId only)' })
  @ApiParam({ name: 'date', type: 'string', description: 'Date in format YYYY-MM-DD' })
  async findSchedulesForDateSimplified(@Param('date') date: string) {
    return await this.ciltSecuencesScheduleService.findSchedulesForDateSimplified(date);
  }

  @Post("/create")
  @RequireRoles(...SITE_ADMIN_ROLES)
  @RequireSiteAccess()
  @SiteResourceAccess(
    {
      resource: 'ciltMaster',
      lookup: 'id',
      source: 'body',
      requestKey: 'ciltId',
      required: false,
    },
    {
      resource: 'ciltSequence',
      lookup: 'id',
      source: 'body',
      requestKey: 'secuenceId',
      required: false,
    },
  )
  @ApiOperation({ summary: 'Create a new schedule' })
  @ApiBody({ type: CreateCiltSecuencesScheduleDto })
  async create(@Body() createDto: CreateCiltSecuencesScheduleDto) {
    return await this.ciltSecuencesScheduleService.create(createDto);
  }

  @Put("/update")
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess(
    {
      resource: 'ciltSchedule',
      lookup: 'id',
      source: 'body',
      requestKey: 'id',
    },
    {
      resource: 'ciltMaster',
      lookup: 'id',
      source: 'body',
      requestKey: 'ciltId',
      required: false,
    },
    {
      resource: 'ciltSequence',
      lookup: 'id',
      source: 'body',
      requestKey: 'secuenceId',
      required: false,
    },
  )
  @ApiOperation({ summary: 'Update a schedule' })
  @ApiBody({ type: UpdateCiltSecuencesScheduleDto })
  async update(@Body() updateDto: UpdateCiltSecuencesScheduleDto) {
    return await this.ciltSecuencesScheduleService.update(updateDto);
  }

  @Delete(':id')
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'ciltSchedule',
    lookup: 'id',
    source: 'params',
    requestKey: 'id',
  })
  @ApiOperation({ summary: 'Delete a schedule' })
  @ApiParam({ name: 'id', type: 'number', description: 'Schedule ID' })
  async delete(@Param('id') id: number) {
    return await this.ciltSecuencesScheduleService.delete(id);
  }

  @Get('/sequences/:sequenceId')
  @SiteResourceAccess({
    resource: 'ciltSequence',
    lookup: 'id',
    source: 'params',
    requestKey: 'sequenceId',
  })
  @ApiOperation({ summary: 'Get all schedules by sequence ID' })
  @ApiParam({ name: 'sequenceId', type: 'number', description: 'Sequence ID' })
  async findBySequenceId(@Param('sequenceId') sequenceId: number) {
    return await this.ciltSecuencesScheduleService.findBySequenceId(sequenceId);
  }

  @Put("/update-order")
  @RequireRoles(...SITE_ADMIN_ROLES)
  @SiteResourceAccess({
    resource: 'ciltSchedule',
    lookup: 'id',
    source: 'body',
    requestKey: 'scheduleId',
  })
  @ApiOperation({ summary: 'Update schedule order' })
  @ApiBody({ type: UpdateScheduleOrderDTO })
  async updateOrder(@Body() updateOrderDto: UpdateScheduleOrderDTO) {
    return await this.ciltSecuencesScheduleService.updateOrder(updateOrderDto);
  }
} 
