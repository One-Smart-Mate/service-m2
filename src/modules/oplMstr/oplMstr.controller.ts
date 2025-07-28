import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { OplMstrService } from './oplMstr.service';
import { CreateOplMstrDTO } from './models/dto/createOplMstr.dto';
import { UpdateOplMstrDTO } from './models/dto/updateOplMstr.dto';
import { UpdateOplMstrOrderDTO } from './models/dto/update-order.dto';

@ApiTags('Opl Master')
@ApiBearerAuth()
@Controller('opl-mstr')
export class OplMstrController {
  constructor(private readonly oplMstrService: OplMstrService) {}

  @Get("/all")
  @ApiOperation({ summary: 'Get all OPLs' })
  @ApiResponse({ status: 200, description: 'List of OPLs'})
  async findAll() {
    return await this.oplMstrService.findAll();
  }

  @Get('creator/:creatorId')
  @ApiOperation({ summary: 'Get all OPLs by creator ID' })
  @ApiParam({ name: 'creatorId', type: 'number', description: 'Creator ID' })
  @ApiResponse({ status: 200, description: 'List of OPLs created by the user'})
  async findByCreatorId(@Param('creatorId') creatorId: number) {
    return await this.oplMstrService.findByCreatorId(creatorId);
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get all OPLs by site ID' })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site ID' })
  @ApiResponse({ status: 200, description: 'List of OPLs associated with the site'})
  async findBySiteId(@Param('siteId') siteId: number) {
    return await this.oplMstrService.findOplMstrBySiteId(siteId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an OPL by ID' })
  @ApiResponse({ status: 200, description: 'OPL found'})
  @ApiResponse({ status: 404, description: 'OPL not found' })
  async findById(@Param('id') id: number) {
    return await this.oplMstrService.findById(id);
  }

  @Post("/create")
  @ApiOperation({ summary: 'Create a new OPL' })
  @ApiResponse({ status: 201, description: 'OPL created successfully'})
  async create(@Body() createOplDto: CreateOplMstrDTO) {
    return await this.oplMstrService.create(createOplDto);
  }

  @Put("/update")
  @ApiOperation({ summary: 'Update an OPL' })
  @ApiResponse({ status: 200, description: 'OPL updated successfully'})
  @ApiResponse({ status: 404, description: 'OPL not found' })
  async update(@Body() updateOplDto: UpdateOplMstrDTO) {
    return await this.oplMstrService.update(updateOplDto);
  }

  @Put("/update-order")
  @ApiOperation({ summary: 'Update OPL order' })
  @ApiResponse({ status: 200, description: 'OPL order updated successfully'})
  @ApiResponse({ status: 404, description: 'OPL not found' })
  async updateOrder(@Body() updateOrderDto: UpdateOplMstrOrderDTO) {
    return await this.oplMstrService.updateOrder(updateOrderDto);
  }   

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an OPL master (soft delete)' })
  @ApiParam({ name: 'id', type: 'number', description: 'OPL master ID' })
  @ApiResponse({ status: 200, description: 'OPL master deleted successfully'})
  @ApiResponse({ status: 404, description: 'OPL master not found' })
  async delete(@Param('id') id: number) {
    return await this.oplMstrService.delete(id);
  }
} 