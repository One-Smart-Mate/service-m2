import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { CiltSequencesService } from './ciltSequences.service';
import { CreateCiltSequenceDTO } from './models/dto/createCiltSequence.dto';
import { UpdateCiltSequenceDTO } from './models/dto/updateCiltSequence.dto';

@ApiTags('Cilt Sequences')
@Controller('cilt-sequences')
export class CiltSequencesController {
  constructor(private readonly ciltSequencesService: CiltSequencesService) {}

  @Get("/all")
  @ApiOperation({ summary: 'Get all CILT sequences' })
  async findAll() {
    return await this.ciltSequencesService.findAll();
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get all CILT sequences by site ID' })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site ID' })
  async findBySiteId(@Param('siteId') siteId: number) {
    return await this.ciltSequencesService.findBySiteId(siteId);
  }

  @Get('position/:positionId')
  @ApiOperation({ summary: 'Get all CILT sequences by position ID' })
  @ApiParam({ name: 'positionId', type: 'number', description: 'Position ID' })
  async findByPositionId(@Param('positionId') positionId: number) {
    return await this.ciltSequencesService.findByPositionId(positionId);
  }

  @Get('area/:areaId')
  @ApiOperation({ summary: 'Get all CILT sequences by area ID' })
  @ApiParam({ name: 'areaId', type: 'number', description: 'Area ID' })
  async findByAreaId(@Param('areaId') areaId: number) {
    return await this.ciltSequencesService.findByAreaId(areaId);
  }

  @Get('cilt/:ciltMstrId')
  @ApiOperation({ summary: 'Get all CILT sequences by CILT master ID' })
  @ApiParam({ name: 'ciltMstrId', type: 'number', description: 'CILT master ID' })
  async findByCiltMstrId(@Param('ciltMstrId') ciltMstrId: number) {
    return await this.ciltSequencesService.findByCiltMstrId(ciltMstrId);
  }

  @Get('level/:levelId')
  @ApiOperation({ summary: 'Get all CILT sequences by level ID' })
  @ApiParam({ name: 'levelId', type: 'number', description: 'Level ID' })
  async findByLevelId(@Param('levelId') levelId: number) {
    return await this.ciltSequencesService.findByLevelId(levelId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CILT sequence by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT sequence ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltSequencesService.findById(id);
  }

  @Post("/create")
  @ApiOperation({ summary: 'Create a new CILT sequence' })
  @ApiBody({ type: CreateCiltSequenceDTO })
  async create(@Body() createCiltSequenceDto: CreateCiltSequenceDTO) {
    return await this.ciltSequencesService.create(createCiltSequenceDto);
  }

  @Put("/update")
  @ApiOperation({ summary: 'Update a CILT sequence' })
  @ApiBody({ type: UpdateCiltSequenceDTO })
  async update(@Body() updateCiltSequenceDto: UpdateCiltSequenceDTO) {
    return await this.ciltSequencesService.update(updateCiltSequenceDto);
  }
} 