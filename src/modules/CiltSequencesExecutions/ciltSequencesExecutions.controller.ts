import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiBody, ApiParam, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CiltSequencesExecutionsService } from './ciltSequencesExecutions.service';
import { CreateCiltSequencesExecutionDTO } from './models/dto/create.ciltSequencesExecution.dto';
import { UpdateCiltSequencesExecutionDTO } from './models/dto/update.ciltSequencesExecution.dto';
import { StartCiltSequencesExecutionDTO } from './models/dto/start.ciltSequencesExecution.dto';
import { StopCiltSequencesExecutionDTO } from './models/dto/stop.ciltSequencesExecution.dto'

@ApiTags('Cilt Sequences Executions')
@Controller('cilt-sequences-executions')
export class CiltSequencesExecutionsController {
  constructor(private readonly ciltSequencesExecutionsService: CiltSequencesExecutionsService) {}

  @Get("/all")
  @ApiOperation({ summary: 'Get all CILT sequence executions' })
  findAll() {
    return this.ciltSequencesExecutionsService.findAll();
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get all CILT sequence executions by site ID' })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site ID' })
  findBySiteId(@Param('siteId') siteId: number) {
    return this.ciltSequencesExecutionsService.findBySiteId(siteId);
  }

  @Get('position/:positionId')
  @ApiOperation({ summary: 'Get all CILT sequence executions by position ID' })
  @ApiParam({ name: 'positionId', type: 'number', description: 'Position ID' })
  findByPositionId(@Param('positionId') positionId: number) {
    return this.ciltSequencesExecutionsService.findByPositionId(positionId);
  }

  @Get('cilt/:ciltId')
  @ApiOperation({ summary: 'Get all CILT sequence executions by CILT ID' })
  @ApiParam({ name: 'ciltId', type: 'number', description: 'CILT ID' })
  findByCiltId(@Param('ciltId') ciltId: number) {
    return this.ciltSequencesExecutionsService.findByCiltId(ciltId);
  }

  @Get('cilt-details/:ciltDetailsId')
  @ApiOperation({ summary: 'Get all CILT sequence executions by CILT details ID' })
  @ApiParam({ name: 'ciltDetailsId', type: 'number', description: 'CILT details ID' })
  findByCiltDetailsId(@Param('ciltDetailsId') ciltDetailsId: number) {
    return this.ciltSequencesExecutionsService.findByCiltDetailsId(ciltDetailsId);
  }

  @Get('cilt-sequence/:ciltSequenceId/date/:date')
  @ApiOperation({ summary: 'Get CILT sequence executions by CILT sequence ID and date' })
  @ApiParam({ name: 'ciltSequenceId', type: 'number', description: 'CILT sequence ID' })
  @ApiParam({ name: 'date', type: 'string', description: 'Date in YYYY-MM-DD format' })
  findByCiltSequenceIdAndDate(
    @Param('ciltSequenceId') ciltSequenceId: number,
    @Param('date') date: string
  ) {
    return this.ciltSequencesExecutionsService.findByCiltSequenceIdAndDate(ciltSequenceId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CILT sequence execution by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT sequence execution ID' })
  findById(@Param('id') id: number) {
    return this.ciltSequencesExecutionsService.findById(+id);
  }

  @Post("/create")
  @ApiOperation({ summary: 'Create a new CILT sequence execution' })
  @ApiBody({ type: CreateCiltSequencesExecutionDTO })
  create(@Body() createCiltSequencesExecutionDTO: CreateCiltSequencesExecutionDTO) {
    return this.ciltSequencesExecutionsService.create(createCiltSequencesExecutionDTO);
  }

  @Put("/start")
  @ApiOperation({ summary: 'Start a CILT sequence execution' })
  @ApiBody({ type: StartCiltSequencesExecutionDTO })
  @ApiResponse({ status: 200, description: 'CILT sequence execution started successfully' })
  @ApiResponse({ status: 404, description: 'CILT sequence execution not found' })
  start(@Body() startDTO: StartCiltSequencesExecutionDTO) {
    return this.ciltSequencesExecutionsService.start(startDTO);
  }

  @Put("/update")
  @ApiOperation({ summary: 'Update a CILT sequence execution' })
  @ApiBody({ type: UpdateCiltSequencesExecutionDTO })
  update(@Body() updateCiltSequencesExecutionDTO: UpdateCiltSequencesExecutionDTO) {
    return this.ciltSequencesExecutionsService.update(updateCiltSequencesExecutionDTO);
  }

  @Put("/stop")
  @ApiOperation({ summary: 'Finish a CILT sequence execution' })
  @ApiBody({ type: StopCiltSequencesExecutionDTO })
  @ApiResponse({ status: 200, description: 'CILT sequence execution finished successfully' })
  @ApiResponse({ status: 404, description: 'CILT sequence execution not found' })
  @ApiResponse({ status: 400, description: 'CILT sequence has not been started or has already been finished' })
  stop(@Body() stopDTO: StopCiltSequencesExecutionDTO) {
    return this.ciltSequencesExecutionsService.stop(stopDTO);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a CILT sequence execution by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT sequence execution ID' })
  @ApiResponse({ status: 200, description: 'CILT sequence execution soft deleted successfully' })
  @ApiResponse({ status: 404, description: 'CILT sequence execution not found' })
  softDelete(@Param('id') id: number) {
    return this.ciltSequencesExecutionsService.softDelete(+id);
  }
} 