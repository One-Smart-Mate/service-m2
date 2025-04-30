import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiBody, ApiParam, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CiltSequencesExecutionsService } from './ciltSequencesExecutions.service';
import { CreateCiltSequencesExecutionDTO } from './models/dto/create.ciltSequencesExecution.dto';
import { UpdateCiltSequencesExecutionDTO } from './models/dto/update.ciltSequencesExecution.dto';

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

  @Put("/update")
  @ApiOperation({ summary: 'Update a CILT sequence execution' })
  @ApiBody({ type: UpdateCiltSequencesExecutionDTO })
  update(@Body() updateCiltSequencesExecutionDTO: UpdateCiltSequencesExecutionDTO) {
    return this.ciltSequencesExecutionsService.update(updateCiltSequencesExecutionDTO);
  }
} 