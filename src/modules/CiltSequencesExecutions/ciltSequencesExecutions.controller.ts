import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiBody, ApiParam, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CiltSequencesExecutionsService } from './ciltSequencesExecutions.service';
import { CreateCiltSequencesExecutionDTO } from './models/dto/create.ciltSequencesExecution.dto';
import { UpdateCiltSequencesExecutionDTO } from './models/dto/update.ciltSequencesExecution.dto';

@ApiTags('Cilt Sequences Executions')
@Controller('cilt-sequences-executions')
export class CiltSequencesExecutionsController {
  constructor(private readonly ciltSequencesExecutionsService: CiltSequencesExecutionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all CILT sequence executions' })
  findAll() {
    return this.ciltSequencesExecutionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CILT sequence execution by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT sequence execution ID' })
  findById(@Param('id') id: number) {
    return this.ciltSequencesExecutionsService.findById(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new CILT sequence execution' })
  @ApiBody({ type: CreateCiltSequencesExecutionDTO })
  create(@Body() createCiltSequencesExecutionDTO: CreateCiltSequencesExecutionDTO) {
    return this.ciltSequencesExecutionsService.create(createCiltSequencesExecutionDTO);
  }

  @Put()
  @ApiOperation({ summary: 'Update a CILT sequence execution' })
  @ApiBody({ type: UpdateCiltSequencesExecutionDTO })
  update(@Body() updateCiltSequencesExecutionDTO: UpdateCiltSequencesExecutionDTO) {
    return this.ciltSequencesExecutionsService.update(updateCiltSequencesExecutionDTO);
  }

  @Get('cilt/:ciltId')
  @ApiOperation({ summary: 'Get CILT sequence executions by CILT ID' })
  @ApiParam({ name: 'ciltId', type: 'number', description: 'CILT ID' })
  findByCiltId(@Param('ciltId') ciltId: number) {
    return this.ciltSequencesExecutionsService.findByCiltId(+ciltId);
  }

  @Get('sequence/:sequenceId')
  @ApiOperation({ summary: 'Get CILT sequence executions by sequence ID' })
  @ApiParam({ name: 'sequenceId', type: 'number', description: 'Sequence ID' })
  findBySequenceId(@Param('sequenceId') sequenceId: number) {
    return this.ciltSequencesExecutionsService.findBySequenceId(+sequenceId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get CILT sequence executions by user ID' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  findByUserId(@Param('userId') userId: number) {
    return this.ciltSequencesExecutionsService.findByUserId(+userId);
  }
} 