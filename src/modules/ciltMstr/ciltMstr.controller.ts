import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { CiltMstrService } from './ciltMstr.service';
import { CreateCiltMstrDTO } from './models/dto/create.ciltMstr.dto';
import { UpdateCiltMstrDTO } from './models/dto/update.ciltMstr.dto';

@ApiTags('Cilt Master')
@Controller('cilt-mstr')
export class CiltMstrController {
  constructor(private readonly ciltMstrService: CiltMstrService) {}

  @Get("/all")
  @ApiOperation({ summary: 'Get all CILTs' })
  async findAll() {
    return await this.ciltMstrService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CILT by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltMstrService.findById(id);
  }

  @Post("/create")
  @ApiOperation({ summary: 'Create a new CILT' })
  @ApiBody({ type: CreateCiltMstrDTO })
  async create(@Body() createCiltDto: CreateCiltMstrDTO) {
    return await this.ciltMstrService.create(createCiltDto);
  }

  @Put("/update")
  @ApiOperation({ summary: 'Update a CILT' })
  @ApiBody({ type: UpdateCiltMstrDTO })
  async update(@Body() updateCiltDto: UpdateCiltMstrDTO) {
    return await this.ciltMstrService.update(updateCiltDto);
  }
}
