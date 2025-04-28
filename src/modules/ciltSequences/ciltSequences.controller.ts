import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { CiltSequencesService } from './ciltSequences.service';
import { CreateCiltSequenceDTO } from './models/dto/createCiltSequence.dto';
import { UpdateCiltSequenceDTO } from './models/dto/updateCiltSequence.dto';
import { ResponseCiltSequenceDTO } from './models/dto/responseCiltSequence.dto';

@ApiTags('Cilt Sequences')
@Controller('cilt-sequences')
export class CiltSequencesController {
  constructor(private readonly ciltSequencesService: CiltSequencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all CILT sequences' })
  async findAll() {
    return await this.ciltSequencesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CILT sequence by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT sequence ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltSequencesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new CILT sequence' })
  @ApiBody({ type: CreateCiltSequenceDTO })
  async create(@Body() createCiltSequenceDto: CreateCiltSequenceDTO) {
    return await this.ciltSequencesService.create(createCiltSequenceDto);
  }

  @Put()
  @ApiOperation({ summary: 'Update a CILT sequence' })
  @ApiBody({ type: UpdateCiltSequenceDTO })
  async update(@Body() updateCiltSequenceDto: UpdateCiltSequenceDTO) {
    return await this.ciltSequencesService.update(updateCiltSequenceDto);
  }
} 