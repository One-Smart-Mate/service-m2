import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { OplDetailsService } from './oplDetails.service';
import { CreateOplDetailsDTO } from './models/dto/createOplDetails.dto';
import { UpdateOplDetailsDTO } from './models/dto/updateOplDetails.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Opl Details')
@Controller('opl-details')
export class OplDetailsController {
  constructor(private readonly oplDetailsService: OplDetailsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all OPL details' })
  @ApiResponse({ status: 200, description: 'List of OPL details'})
  async findAll() {
    return await this.oplDetailsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an OPL detail by ID' })
  @ApiResponse({ status: 200, description: 'OPL detail found'})
  @ApiResponse({ status: 404, description: 'OPL detail not found' })
  async findById(@Param('id') id: number) {
    return await this.oplDetailsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new OPL detail' })
  @ApiResponse({ status: 201, description: 'OPL detail created successfully'})
  async create(@Body() createOplDetailsDto: CreateOplDetailsDTO) {
    return await this.oplDetailsService.create(createOplDetailsDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update an OPL detail' })
  @ApiResponse({ status: 200, description: 'OPL detail updated successfully'})
  @ApiResponse({ status: 404, description: 'OPL detail not found' })
  async update(@Body() updateOplDetailsDto: UpdateOplDetailsDTO) {
    return await this.oplDetailsService.update(updateOplDetailsDto);
  }
} 