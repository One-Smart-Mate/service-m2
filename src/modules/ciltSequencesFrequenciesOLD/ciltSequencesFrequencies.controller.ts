import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CiltSequencesFrequenciesService } from './ciltSequencesFrequencies.service';
import { CreateCiltSequencesFrequenciesDTO } from './models/dto/createCiltSequencesFrequencies.dto';
import { UpdateCiltSequencesFrequenciesDTO } from './models/dto/updateCiltSequencesFrequencies.dto';

@ApiTags('Cilt Sequences Frequencies OLD')
@ApiBearerAuth()
@Controller('cilt-sequences-frequencies-OLD')
export class CiltSequencesFrequenciesController {
  constructor(private readonly ciltSequencesFrequenciesService: CiltSequencesFrequenciesService) {}

  @Get("/all")
  @ApiOperation({ summary: 'Get all CILT sequence frequencies' })
  async findAll() {
    return await this.ciltSequencesFrequenciesService.findAll();
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get all CILT sequence frequencies by site ID' })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site ID' })
  async findBySiteId(@Param('siteId') siteId: number) {
    return await this.ciltSequencesFrequenciesService.findBySiteId(siteId);
  }

  @Get('position/:positionId')
  @ApiOperation({ summary: 'Get all CILT sequence frequencies by position ID' })
  @ApiParam({ name: 'positionId', type: 'number', description: 'Position ID' })
  async findByPositionId(@Param('positionId') positionId: number) {
    return await this.ciltSequencesFrequenciesService.findByPositionId(positionId);
  }

  @Get('cilt/:ciltId')
  @ApiOperation({ summary: 'Get all CILT sequence frequencies by CILT ID' })
  @ApiParam({ name: 'ciltId', type: 'number', description: 'CILT ID' })
  async findByCiltId(@Param('ciltId') ciltId: number) {
    return await this.ciltSequencesFrequenciesService.findByCiltId(ciltId);
  }

  @Get('frequency/:frecuencyId')
  @ApiOperation({ summary: 'Get all CILT sequence frequencies by frequency ID' })
  @ApiParam({ name: 'frecuencyId', type: 'number', description: 'Frequency ID' })
  async findByFrecuencyId(@Param('frecuencyId') frecuencyId: number) {
    return await this.ciltSequencesFrequenciesService.findByFrecuencyId(frecuencyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CILT sequence frequency by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT sequence frequency ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltSequencesFrequenciesService.findById(id);
  }

  @Post("/create")
  @ApiOperation({ summary: 'Create a new CILT sequence frequency' })
  @ApiBody({ type: CreateCiltSequencesFrequenciesDTO })
  async create(@Body() createCiltSequencesFrequenciesDto: CreateCiltSequencesFrequenciesDTO) {
    return await this.ciltSequencesFrequenciesService.create(createCiltSequencesFrequenciesDto);
  }

  @Put("/update")
  @ApiOperation({ summary: 'Update a CILT sequence frequency' })
  @ApiBody({ type: UpdateCiltSequencesFrequenciesDTO })
  async update(@Body() updateCiltSequencesFrequenciesDto: UpdateCiltSequencesFrequenciesDTO) {
    return await this.ciltSequencesFrequenciesService.update(updateCiltSequencesFrequenciesDto);
  }
} 