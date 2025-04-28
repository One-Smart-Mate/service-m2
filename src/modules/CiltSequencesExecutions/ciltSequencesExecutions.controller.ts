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

  @Put(':id')
  @ApiOperation({ summary: 'Update a CILT sequence execution' })
  @ApiBody({ type: UpdateCiltSequencesExecutionDTO })
  update(@Param('id') id: number, @Body() updateCiltSequencesExecutionDTO: UpdateCiltSequencesExecutionDTO) {
    return this.ciltSequencesExecutionsService.update(id, updateCiltSequencesExecutionDTO);
  }
  
} 