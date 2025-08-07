import { Controller, Get, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { IncidentService } from './incident.service';

@ApiTags('Incident')
@ApiBearerAuth()
@Controller('incident')
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Get("all")
  @ApiOperation({ summary: 'Get all incidents' })
  async findAll() {
    return await this.incidentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an incident by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Incident ID' })
  async findById(@Param('id') id: number) {
    return await this.incidentService.findById(id);
  }

  @Put("resolve/:id")
  @ApiOperation({ summary: 'Resolve an incident' })
  async resolve(@Param('id') id: number) {
    return await this.incidentService.resolve(id);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Delete an incident by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Incident ID' })
  async remove(@Param('id') id: number) {
    return await this.incidentService.softDelete(id);
  }
}
