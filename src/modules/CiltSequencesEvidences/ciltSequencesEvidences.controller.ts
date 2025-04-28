import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { CiltSequencesEvidencesService } from './ciltSequencesEvidences.service';
import { CreateCiltSequencesEvidenceDTO } from './models/dtos/createCiltSequencesEvidence.dto';
import { UpdateCiltSequencesEvidenceDTO } from './models/dtos/updateCiltSequencesEvidence.dto';

@ApiTags('Cilt Sequences Evidences')
@Controller('cilt-sequences-evidences')
export class CiltSequencesEvidencesController {
  constructor(private readonly ciltSequencesEvidencesService: CiltSequencesEvidencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all CILT evidences' })
  async findAll() {
    return await this.ciltSequencesEvidencesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CILT evidence by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT evidence ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltSequencesEvidencesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new CILT evidence' })
  @ApiBody({ type: CreateCiltSequencesEvidenceDTO })
  async create(@Body() createCiltSequencesEvidenceDTO: CreateCiltSequencesEvidenceDTO) {
    return await this.ciltSequencesEvidencesService.create(createCiltSequencesEvidenceDTO);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a CILT evidence' })
  @ApiBody({ type: UpdateCiltSequencesEvidenceDTO })
  async update(
    @Param('id') id: number,
    @Body() updateCiltSequencesEvidenceDTO: UpdateCiltSequencesEvidenceDTO,
  ) {
    return await this.ciltSequencesEvidencesService.update(id, updateCiltSequencesEvidenceDTO);
  }
} 