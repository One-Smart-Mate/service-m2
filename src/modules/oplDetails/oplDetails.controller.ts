import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { OplDetailsService } from './oplDetails.service';
import { CreateOplDetailsDTO } from './models/dto/createOplDetails.dto';
import { UpdateOplDetailsDTO } from './models/dto/updateOplDetails.dto';
import { UpdateOplDetailOrderDTO } from './models/dto/update-order.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Opl Details')
@ApiBearerAuth()
@Controller('opl-details')
export class OplDetailsController {
  constructor(private readonly oplDetailsService: OplDetailsService) {}

  @Get("/all")
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

  @Get('/by-opl/:oplId')
  @ApiOperation({ summary: 'Get OPL details by OPL ID' })
  @ApiResponse({ status: 200, description: 'List of OPL details found'})
  @ApiResponse({ status: 404, description: 'No OPL details found' })
  async findByOplId(@Param('oplId') oplId: number) {
    return await this.oplDetailsService.findByOplId(oplId);
  }

  @Post("/create")
  @ApiOperation({ summary: 'Create a new OPL detail' })
  @ApiResponse({ status: 201, description: 'OPL detail created successfully'})
  async create(@Body() createOplDetailsDto: CreateOplDetailsDTO) {
    return await this.oplDetailsService.create(createOplDetailsDto);
  }

  @Put("/update")
  @ApiOperation({ summary: 'Update an OPL detail' })
  @ApiResponse({ status: 200, description: 'OPL detail updated successfully'})
  @ApiResponse({ status: 404, description: 'OPL detail not found' })
  async update(@Body() updateOplDetailsDto: UpdateOplDetailsDTO) {
    return await this.oplDetailsService.update(updateOplDetailsDto);
  }

  @Put("/update-order")
  @ApiOperation({ summary: 'Update OPL detail order' })
  @ApiResponse({ status: 200, description: 'OPL detail order updated successfully'})
  @ApiResponse({ status: 404, description: 'OPL detail not found' })
  async updateOrder(@Body() updateOrderDto: UpdateOplDetailOrderDTO) {
    return await this.oplDetailsService.updateOrder(updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an OPL detail (soft delete)' })
  @ApiResponse({ status: 200, description: 'OPL detail deleted successfully'})
  @ApiResponse({ status: 404, description: 'OPL detail not found' })
  async delete(@Param('id') id: number) {
    return await this.oplDetailsService.delete(id);
  }
} 