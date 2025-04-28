import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { CiltFrequenciesService } from './ciltFrequencies.service';
import { CreateCiltFrequenciesDTO } from './models/dto/createCiltFrequencies.dto';
import { UpdateCiltFrequenciesDTO } from './models/dto/updateCiltFrequencies.dto';


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
  @ApiBody({ type: CreateCiltFrequenciesDTO })
  async create(@Body() createCiltFrequencyDto: CreateCiltFrequenciesDTO) {
    return await this.ciltFrequenciesService.create(createCiltFrequencyDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a CILT frequency' })
  @ApiBody({ type: UpdateCiltFrequenciesDTO })
  async update(@Param('id') id: number, @Body() updateCiltFrequencyDto: UpdateCiltFrequenciesDTO) {
    return await this.ciltFrequenciesService.update(id, updateCiltFrequencyDto);
  }
} 