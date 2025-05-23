import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OplLevelsService } from './oplLevels.service';
import { CreateOplLevelsDTO } from './models/create-opl-levels.dto';

@ApiTags('opl-levels')
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a relation (soft delete)' })
  @ApiResponse({ status: 200, description: 'Relation deleted correctly' })
  @ApiResponse({ status: 404, description: 'Relation not found' })
  remove(@Param('id') id: number) {
    return this.oplLevelsService.remove(id);
  }
} 