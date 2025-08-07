import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { OplTypesService } from './oplTypes.service';
import { CreateOplTypeDto } from './models/dto/createOplType.dto';
import { UpdateOplTypeDto } from './models/dto/updateOplType.dto';

@ApiTags('Opl Types')
@ApiBearerAuth()
@Controller('opl-types')
export class OplTypesController {
  constructor(private readonly oplTypesService: OplTypesService) {}

  @Get("/all")
  @ApiOperation({ summary: 'Get all OPL types' })
  @ApiResponse({ status: 200, description: 'List of OPL types'})
  async findAll() {
    return await this.oplTypesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an OPL type by ID' })
  @ApiResponse({ status: 200, description: 'OPL type found'})
  @ApiResponse({ status: 404, description: 'OPL type not found' })
  async findById(@Param('id') id: number) {
    return await this.oplTypesService.findById(id);
  }

  @Post("/create")
  @ApiOperation({ summary: 'Create a new OPL type' })
  @ApiResponse({ status: 201, description: 'OPL type created successfully'})
  async create(@Body() createOplDto: CreateOplTypeDto) {
    return await this.oplTypesService.create(createOplDto);
  }

  @Put("/update")
  @ApiOperation({ summary: 'Update an OPL type' })
  @ApiResponse({ status: 200, description: 'OPL type updated successfully'})
  @ApiResponse({ status: 404, description: 'OPL type not found' })
  async update(@Body() updateOplDto: UpdateOplTypeDto) {
    return await this.oplTypesService.update(updateOplDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an OPL type (soft delete)' })
  @ApiParam({ name: 'id', type: 'number', description: 'OPL type ID' })
  @ApiResponse({ status: 200, description: 'OPL type deleted successfully'})
  @ApiResponse({ status: 404, description: 'OPL type not found' })
  async delete(@Param('id') id: number) {
    return await this.oplTypesService.softDelete(id);
  }
}