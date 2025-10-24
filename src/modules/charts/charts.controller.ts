import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ChartsService } from './charts.service';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { SiteAccessGuard } from '../auth/guard/site-access.guard';

@Controller('charts')
@UseGuards(AuthGuard, SiteAccessGuard)
@ApiTags('charts')
@ApiBearerAuth()
export class ChartsController {
  constructor(private readonly chartsService: ChartsService) {}

  /**
   * GET /charts?siteId={siteId}&status=A
   * Get all active charts, optionally filtered by site
   */
  @Get()
  @ApiQuery({ name: 'siteId', required: false, description: 'Filter charts by site ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (default: A)' })
  async findAll(@Query('siteId') siteId?: string) {
    const charts = await this.chartsService.findAll(siteId ? parseInt(siteId) : undefined);
    return { data: charts };
  }

  /**
   * GET /charts/:chartId/levels?level_type={grouping|target}&status=A
   * Get chart levels for a specific chart
   */
  @Get(':chartId/levels')
  @ApiParam({ name: 'chartId', description: 'Chart ID' })
  @ApiQuery({ name: 'level_type', required: false, enum: ['grouping', 'target'], description: 'Filter by level type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (default: A)' })
  async findChartLevels(
    @Param('chartId', ParseIntPipe) chartId: number,
    @Query('level_type') levelType?: 'grouping' | 'target',
  ) {
    const levels = await this.chartsService.findChartLevels(chartId, levelType);
    return { data: levels };
  }
}
