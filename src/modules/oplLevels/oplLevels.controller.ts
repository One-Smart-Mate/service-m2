import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OplLevelsService } from './oplLevels.service';
import { CreateOplLevelsDTO } from './models/create-opl-levels.dto';

@ApiTags('opl-levels')
@ApiBearerAuth()
@Controller('opl-levels')
export class OplLevelsController {
  constructor(private readonly oplLevelsService: OplLevelsService) {}

  @Post()
  @ApiOperation({ summary: 'Make a new OPL level relation' })
  @ApiResponse({ status: 201, description: 'Relation created correctly' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  create(@Body() createOplLevelsDTO: CreateOplLevelsDTO) {
    return this.oplLevelsService.create(createOplLevelsDTO);
  }

  @Get('level/:levelId')
  @ApiOperation({ summary: 'Get all OPLs by level ID' })
  @ApiParam({ name: 'levelId', type: 'number', description: 'Level ID' })
  @ApiResponse({ status: 200, description: 'List of OPLs associated with the level'})
  async findByLevelId(@Param('levelId') levelId: number) {
    return await this.oplLevelsService.findOplMstrByLevelId(levelId);
  }

  @Get('opl/:oplId')
  @ApiOperation({ summary: 'Get all level relations by OPL ID' })
  @ApiParam({ name: 'oplId', type: 'number', description: 'OPL ID' })
  @ApiResponse({ status: 200, description: 'List of level relations for the OPL' })
  async findByOplId(@Param('oplId') oplId: number) {
    return await this.oplLevelsService.findLevelsByOplId(oplId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a relation (soft delete)' })
  @ApiResponse({ status: 200, description: 'Relation deleted correctly' })
  @ApiResponse({ status: 404, description: 'Relation not found' })
  remove(@Param('id') id: number) {
    return this.oplLevelsService.remove(id);
  }
} 