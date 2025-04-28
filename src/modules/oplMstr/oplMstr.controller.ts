import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OplMstrService } from './oplMstr.service';
import { CreateOplMstrDTO } from './models/dto/createOplMstr.dto';
import { UpdateOplMstrDTO } from './models/dto/updateOplMstr.dto';


@ApiTags('Opl Master')
@Controller('opl-mstr')
export class OplMstrController {
  constructor(private readonly oplMstrService: OplMstrService) {}

  @Get()
  @ApiOperation({ summary: 'Get all OPLs' })
  @ApiResponse({ status: 200, description: 'List of OPLs'})
  async findAll() {
    return await this.oplMstrService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an OPL by ID' })
  @ApiResponse({ status: 200, description: 'OPL found'})
  @ApiResponse({ status: 404, description: 'OPL not found' })
  async findById(@Param('id') id: number) {
    return await this.oplMstrService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new OPL' })
  @ApiResponse({ status: 201, description: 'OPL created successfully'})
  async create(@Body() createOplDto: CreateOplMstrDTO) {
    return await this.oplMstrService.create(createOplDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update an OPL' })
  @ApiResponse({ status: 200, description: 'OPL updated successfully'})
  @ApiResponse({ status: 404, description: 'OPL not found' })
  async update(@Body() updateOplDto: UpdateOplMstrDTO) {
    return await this.oplMstrService.update(updateOplDto);
  }
} 