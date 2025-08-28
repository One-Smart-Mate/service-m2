import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBody, ApiParam, ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CiltSequencesExecutionsService } from './ciltSequencesExecutions.service';
import { CreateCiltSequencesExecutionDTO } from './models/dto/create.ciltSequencesExecution.dto';
import { UpdateCiltSequencesExecutionDTO } from './models/dto/update.ciltSequencesExecution.dto';
import { StartCiltSequencesExecutionDTO } from './models/dto/start.ciltSequencesExecution.dto';
import { StopCiltSequencesExecutionDTO } from './models/dto/stop.ciltSequencesExecution.dto'
import { CreateCiltSequencesEvidenceDTO } from '../CiltSequencesExecutionsEvidences/models/dtos/createCiltSequencesEvidence.dto';
import { CreateEvidenceDTO } from './models/dto/create.evidence.dto';
import { GenerateCiltSequencesExecutionDTO } from './models/dto/generate.ciltSequencesExecution.dto';
import { ChartFiltersDTO } from './models/dto/chart.filters.dto';
import { 
  ExecutionChartResponseDTO, 
  ComplianceByPersonChartResponseDTO, 
  TimeChartResponseDTO, 
  AnomaliesChartResponseDTO
} from './models/dto/chart.response.dto';

@ApiTags('Cilt Sequences Executions')
@ApiBearerAuth()
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

  @Post("/generate")
  @ApiOperation({ summary: 'Generate a new CILT sequence execution from sequence data' })
  @ApiBody({ type: GenerateCiltSequencesExecutionDTO })
  @ApiResponse({ status: 201, description: 'CILT sequence execution generated successfully' })
  @ApiResponse({ status: 404, description: 'Sequence or User not found' })
  generate(@Body() generateDto: GenerateCiltSequencesExecutionDTO) {
    return this.ciltSequencesExecutionsService.generate(generateDto);
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

  @Get('user/:userId/date/:date')
  @ApiOperation({ summary: 'Get all CILT sequence executions by user ID and date' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiParam({ name: 'date', type: 'string', description: 'Date in YYYY-MM-DD format' })
  findAllByUserIdAndDate(@Param('userId') userId: number, @Param('date') date: string) {
    return this.ciltSequencesExecutionsService.findAllByUserIdAndDate(userId, date);
  }

  @Post('evidence/create')
  @ApiOperation({ summary: 'Create a new CILT sequence execution evidence' })
  @ApiBody({ type: CreateEvidenceDTO })
  createEvidence(@Body() createEvidenceDTO: CreateEvidenceDTO) {
    return this.ciltSequencesExecutionsService.createEvidence(createEvidenceDTO);
  }

  @Delete('evidence/:id')
  @ApiOperation({ summary: 'Delete evidence' })
  @ApiParam({ name: 'id', type: 'number', description: 'Evidence ID' })
  deleteEvidence(@Param('id') id: number) {
    return this.ciltSequencesExecutionsService.deleteEvidence(id);
  }

  @Get('charts/execution')
  @ApiOperation({ summary: 'Get data for execution chart (programmed vs executed)' })
  @ApiQuery({ name: 'startDate', type: 'string', description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', type: 'string', description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'siteId', type: 'number', required: false, description: 'Site ID' })
  @ApiQuery({ name: 'positionId', type: 'number', required: false, description: 'Position ID' })
  @ApiQuery({ name: 'levelId', type: 'number', required: false, description: 'Level ID' })
  @ApiResponse({ type: [ExecutionChartResponseDTO] })
  getExecutionChart(@Query() filters: ChartFiltersDTO) {
    return this.ciltSequencesExecutionsService.getExecutionChart(filters);
  }

  @Get('charts/compliance')
  @ApiOperation({ summary: 'Get data for compliance chart by person' })
  @ApiQuery({ name: 'startDate', type: 'string', description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', type: 'string', description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'siteId', type: 'number', required: false, description: 'Site ID' })
  @ApiQuery({ name: 'positionId', type: 'number', required: false, description: 'Position ID' })
  @ApiQuery({ name: 'levelId', type: 'number', required: false, description: 'Level ID' })
  @ApiResponse({ type: [ComplianceByPersonChartResponseDTO] })
  getComplianceChart(@Query() filters: ChartFiltersDTO) {
    return this.ciltSequencesExecutionsService.getComplianceByPersonChart(filters);
  }

  @Get('charts/time')
  @ApiOperation({ summary: 'Get data for time chart (standard vs real)' })
  @ApiQuery({ name: 'startDate', type: 'string', description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', type: 'string', description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'siteId', type: 'number', required: false, description: 'Site ID' })
  @ApiQuery({ name: 'positionId', type: 'number', required: false, description: 'Position ID' })
  @ApiQuery({ name: 'levelId', type: 'number', required: false, description: 'Level ID' })
  @ApiResponse({ type: [TimeChartResponseDTO] })
  getTimeChart(@Query() filters: ChartFiltersDTO) {
    return this.ciltSequencesExecutionsService.getTimeChart(filters);
  }

  @Get('charts/anomalies')
  @ApiOperation({ summary: 'Get data for anomalies chart (TAGs)' })
  @ApiQuery({ name: 'startDate', type: 'string', description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', type: 'string', description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'siteId', type: 'number', required: false, description: 'Site ID' })
  @ApiQuery({ name: 'positionId', type: 'number', required: false, description: 'Position ID' })
  @ApiQuery({ name: 'levelId', type: 'number', required: false, description: 'Level ID' })
  @ApiResponse({ type: [AnomaliesChartResponseDTO] })
  getAnomaliesChart(@Query() filters: ChartFiltersDTO) {
    return this.ciltSequencesExecutionsService.getAnomaliesChart(filters);
  }


} 