import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { CiltSequencesFrequenciesService } from './ciltSequencesFrequencies.service';
import { CreateCiltSequencesFrequenciesDTO } from './models/dto/createCiltSequencesFrequencies.dto';
import { UpdateCiltSequencesFrequenciesDTO } from './models/dto/updateCiltSequencesFrequencies.dto';


@ApiTags('Cilt Sequences Frequencies')
@Controller('cilt-sequences-frequencies')
export class CiltSequencesFrequenciesController {
  constructor(private readonly ciltSequencesFrequenciesService: CiltSequencesFrequenciesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all CILT sequence frequencies' })
  async findAll() {
    return await this.ciltSequencesFrequenciesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CILT sequence frequency by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT sequence frequency ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltSequencesFrequenciesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new CILT sequence frequency' })
  @ApiBody({ type: CreateCiltSequencesFrequenciesDTO })
  async create(@Body() createCiltSequencesFrequenciesDto: CreateCiltSequencesFrequenciesDTO) {
    return await this.ciltSequencesFrequenciesService.create(createCiltSequencesFrequenciesDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update a CILT sequence frequency' })
  @ApiBody({ type: UpdateCiltSequencesFrequenciesDTO })
  async update(@Body() updateCiltSequencesFrequenciesDto: UpdateCiltSequencesFrequenciesDTO) {
    return await this.ciltSequencesFrequenciesService.update(updateCiltSequencesFrequenciesDto);
  }
} 