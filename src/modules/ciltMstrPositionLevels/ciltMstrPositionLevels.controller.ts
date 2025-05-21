import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { CiltMstrPositionLevelsService } from './ciltMstrPositionLevels.service';
import { CreateCiltMstrPositionLevelsDto } from './model/create.ciltMstrPositionLevels.dto';
import { UpdateCiltMstrPositionLevelsDto } from './model/update.ciltMstrPositionLevels.dto';

@ApiTags('CILT Master Position Levels')
@Controller('cilt-mstr-position-levels')
export class CiltMstrPositionLevelsController {
  constructor(
    private readonly ciltMstrPositionLevelsService: CiltMstrPositionLevelsService,
  ) {}

  @Get("/all")
  @ApiOperation({ summary: 'Get all CILT Position Levels' })
  async findAll() {
    return await this.ciltMstrPositionLevelsService.findAll();
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get all CILT Position Levels by Site ID' })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site ID' })
  async findBySiteId(@Param('siteId') siteId: number) {
    return await this.ciltMstrPositionLevelsService.findBySiteId(siteId);
  }

  @Get('cilt-mstr/:ciltMstrId')
  @ApiOperation({ summary: 'Get all CILT Position Levels by CILT Master ID' })
  @ApiParam({ name: 'ciltMstrId', type: 'number', description: 'CILT Master ID' })
  async findByCiltMstrId(@Param('ciltMstrId') ciltMstrId: number) {
    return await this.ciltMstrPositionLevelsService.findByCiltMstrId(ciltMstrId);
  }

  @Get('position/:positionId')
  @ApiOperation({ summary: 'Get all CILT Position Levels by Position ID' })
  @ApiParam({ name: 'positionId', type: 'number', description: 'Position ID' })
  async findByPositionId(@Param('positionId') positionId: number) {
    return await this.ciltMstrPositionLevelsService.findByPositionId(positionId);
  }

  @Get('level/:levelId')
  @ApiOperation({ summary: 'Get all CILT Position Levels by Level ID' })
  @ApiParam({ name: 'levelId', type: 'number', description: 'Level ID' })
  async findByLevelId(@Param('levelId') levelId: number) {
    return await this.ciltMstrPositionLevelsService.findByLevelId(levelId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CILT Position Level by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT Position Level ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltMstrPositionLevelsService.findById(id);
  }

  @Post("/create")
  @ApiOperation({ summary: 'Create a new CILT Position Level' })
  @ApiBody({ type: CreateCiltMstrPositionLevelsDto })
  async create(@Body() createDto: CreateCiltMstrPositionLevelsDto) {
    return await this.ciltMstrPositionLevelsService.create(createDto);
  }

  @Put("/update")
  @ApiOperation({ summary: 'Update a CILT Position Level' })
  @ApiBody({ type: UpdateCiltMstrPositionLevelsDto })
  async update(@Body() updateDto: UpdateCiltMstrPositionLevelsDto) {
    return await this.ciltMstrPositionLevelsService.update(updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CILT Position Level' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT Position Level ID' })
  async remove(@Param('id') id: number) {
    return await this.ciltMstrPositionLevelsService.remove(id);
  }
}
