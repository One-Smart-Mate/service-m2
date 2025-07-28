import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CiltSecuencesScheduleService } from './ciltSecuencesSchedule.service';
import { CreateCiltSecuencesScheduleDto } from './models/dto/create.ciltSecuencesSchedule.dto';
import { UpdateCiltSecuencesScheduleDto } from './models/dto/update.ciltSecuencesSchedule.dto';
import { UpdateScheduleOrderDTO } from './models/dto/update-order.dto';

@ApiTags('CILT Secuences Schedule')
@ApiBearerAuth()
@Controller('cilt-secuences-schedule')
export class CiltSecuencesScheduleController {
  constructor(private readonly ciltSecuencesScheduleService: CiltSecuencesScheduleService) {}

  @Get("/all")
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
  @ApiOperation({ summary: 'Get all schedules by CILT ID' })
  @ApiParam({ name: 'ciltId', type: 'number', description: 'CILT ID' })
  async findByCiltId(@Param('ciltId') ciltId: number) {
    return await this.ciltSecuencesScheduleService.findByCiltId(ciltId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a schedule by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Schedule ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltSecuencesScheduleService.findById(id);
  }

  @Get('date/:date')
  @ApiOperation({ summary: 'Get schedules for a specific date' })
  @ApiParam({ name: 'date', type: 'string', description: 'Date in format YYYY-MM-DD' })
  async findSchedulesForDate(@Param('date') date: string) {
    return await this.ciltSecuencesScheduleService.findSchedulesForDate(date);
  }

  @Get('date-simplified/:date')
  @ApiOperation({ summary: 'Get simplified schedules for a specific date (id, siteId, ciltId, secuenceId only)' })
  @ApiParam({ name: 'date', type: 'string', description: 'Date in format YYYY-MM-DD' })
  async findSchedulesForDateSimplified(@Param('date') date: string) {
    return await this.ciltSecuencesScheduleService.findSchedulesForDateSimplified(date);
  }

  @Post("/create")
  @ApiOperation({ summary: 'Create a new schedule' })
  @ApiBody({ type: CreateCiltSecuencesScheduleDto })
  async create(@Body() createDto: CreateCiltSecuencesScheduleDto) {
    return await this.ciltSecuencesScheduleService.create(createDto);
  }

  @Put("/update")
  @ApiOperation({ summary: 'Update a schedule' })
  @ApiBody({ type: UpdateCiltSecuencesScheduleDto })
  async update(@Body() updateDto: UpdateCiltSecuencesScheduleDto) {
    return await this.ciltSecuencesScheduleService.update(updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a schedule' })
  @ApiParam({ name: 'id', type: 'number', description: 'Schedule ID' })
  async delete(@Param('id') id: number) {
    return await this.ciltSecuencesScheduleService.delete(id);
  }

  @Get('/sequences/:sequenceId')
  @ApiOperation({ summary: 'Get all schedules by sequence ID' })
  @ApiParam({ name: 'sequenceId', type: 'number', description: 'Sequence ID' })
  async findBySequenceId(@Param('sequenceId') sequenceId: number) {
    return await this.ciltSecuencesScheduleService.findBySequenceId(sequenceId);
  }

  @Put("/update-order")
  @ApiOperation({ summary: 'Update schedule order' })
  @ApiBody({ type: UpdateScheduleOrderDTO })
  async updateOrder(@Body() updateOrderDto: UpdateScheduleOrderDTO) {
    return await this.ciltSecuencesScheduleService.updateOrder(updateOrderDto);
  }
} 