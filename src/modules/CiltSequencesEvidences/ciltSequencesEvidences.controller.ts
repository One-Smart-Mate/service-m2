import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { CiltSequencesEvidencesService } from './ciltSequencesEvidences.service';
import { CreateCiltSequencesEvidenceDTO } from './models/dtos/createCiltSequencesEvidence.dto';
import { UpdateCiltSequencesEvidenceDTO } from './models/dtos/updateCiltSequencesEvidence.dto';

@ApiTags('Cilt Sequences Evidences')
@Controller('cilt-sequences-evidences')
export class CiltSequencesEvidencesController {
  constructor(private readonly ciltSequencesEvidencesService: CiltSequencesEvidencesService) {}

  @Get("/all")
  @ApiOperation({ summary: 'Get all CILT evidences' })
  async findAll() {
    return await this.ciltSequencesEvidencesService.findAll();
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get all CILT evidences by site ID' })
  @ApiParam({ name: 'siteId', type: 'number', description: 'Site ID' })
  async findBySiteId(@Param('siteId') siteId: number) {
    return await this.ciltSequencesEvidencesService.findBySiteId(siteId);
  }

  @Get('position/:positionId')
  @ApiOperation({ summary: 'Get all CILT evidences by position ID' })
  @ApiParam({ name: 'positionId', type: 'number', description: 'Position ID' })
  async findByPositionId(@Param('positionId') positionId: number) {
    return await this.ciltSequencesEvidencesService.findByPositionId(positionId);
  }

  @Get('cilt/:ciltId')
  @ApiOperation({ summary: 'Get all CILT evidences by CILT ID' })
  @ApiParam({ name: 'ciltId', type: 'number', description: 'CILT ID' })
  async findByCiltId(@Param('ciltId') ciltId: number) {
    return await this.ciltSequencesEvidencesService.findByCiltId(ciltId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CILT evidence by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'CILT evidence ID' })
  async findById(@Param('id') id: number) {
    return await this.ciltSequencesEvidencesService.findById(id);
  }

  @Post("/create")
  @ApiOperation({ summary: 'Create a new CILT evidence' })
  @ApiBody({ type: CreateCiltSequencesEvidenceDTO })
  async create(@Body() createCiltSequencesEvidenceDTO: CreateCiltSequencesEvidenceDTO) {
    return await this.ciltSequencesEvidencesService.create(createCiltSequencesEvidenceDTO);
  }

  @Put("/update")
  @ApiOperation({ summary: 'Update a CILT evidence' })
  @ApiBody({ type: UpdateCiltSequencesEvidenceDTO })
  async update(
    @Body() updateCiltSequencesEvidenceDTO: UpdateCiltSequencesEvidenceDTO,
  ) {
    return await this.ciltSequencesEvidencesService.update(updateCiltSequencesEvidenceDTO);
  }
} 