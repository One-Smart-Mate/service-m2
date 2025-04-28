import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { CiltFrequenciesService } from './ciltFrequencies.service';
import { CreateCiltFrequencyDTO } from './models/dto/createCiltFrequency.dto';
import { UpdateCiltFrequencyDTO } from './models/dto/updateCiltFrequency.dto';
import { ResponseCiltFrequencyDTO } from './models/dto/responseCiltFrequency.dto';

@ApiTags('Cilt Frequencies')
@Controller('cilt-frequencies')
export class CiltFrequenciesController {
  constructor(private readonly ciltFrequenciesService: CiltFrequenciesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all CILT frequencies' })
  async findAll() {
    return await this.ciltFrequenciesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CILT frequency by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT frequency ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltFrequenciesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new CILT frequency' })
  @ApiBody({ type: CreateCiltFrequencyDTO })
  async create(@Body() createCiltFrequencyDto: CreateCiltFrequencyDTO) {
    return await this.ciltFrequenciesService.create(createCiltFrequencyDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update a CILT frequency' })
  @ApiBody({ type: UpdateCiltFrequencyDTO })
  async update(@Body() updateCiltFrequencyDto: UpdateCiltFrequencyDTO) {
    return await this.ciltFrequenciesService.update(updateCiltFrequencyDto);
  }
} 