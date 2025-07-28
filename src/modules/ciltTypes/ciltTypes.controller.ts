import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CiltTypesService } from './ciltTypes.service';
import { CreateCiltTypeDTO } from './models/dto/createCiltType.dto';
import { UpdateCiltTypeDTO } from './models/dto/updateCiltType.dto';

@ApiTags('Cilt Types')
@ApiBearerAuth()
@Controller('cilt-types')
export class CiltTypesController {
  constructor(private readonly ciltTypesService: CiltTypesService) {}

  @Get("/all")
  @ApiOperation({ summary: 'Get all CILT types' })
  async findAll() {
    return await this.ciltTypesService.findAll();
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get all CILT types by site ID' })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site ID' })
  async findBySiteId(@Param('siteId') siteId: number) {
    return await this.ciltTypesService.findBySiteId(siteId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CILT type by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT type ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltTypesService.findById(id);
  }

  @Post("/create")
  @ApiOperation({ summary: 'Create a new CILT type' })
  @ApiBody({ type: CreateCiltTypeDTO })
  async create(@Body() createCiltTypeDto: CreateCiltTypeDTO) {
    return await this.ciltTypesService.create(createCiltTypeDto);
  }

  @Put("/update")
  @ApiOperation({ summary: 'Update a CILT type' })
  @ApiBody({ type: UpdateCiltTypeDTO })
  async update(@Body() updateCiltTypeDto: UpdateCiltTypeDTO) {
    return await this.ciltTypesService.update(updateCiltTypeDto);
  }
} 