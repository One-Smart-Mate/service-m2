import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chart } from './entities/chart.entity';
import { ChartLevel } from './entities/chart-level.entity';

@Injectable()
export class ChartsService {
  constructor(
    @InjectRepository(Chart)
    private readonly chartRepository: Repository<Chart>,
    @InjectRepository(ChartLevel)
    private readonly chartLevelRepository: Repository<ChartLevel>,
  ) {}

  /**
   * Get all active charts, optionally filtered by siteId
   * Matching PHP demo lines 41-47
   * OPTIMIZED: Explicit SELECT + cache for 5 minutes
   */
  async findAll(siteId?: number) {
    const query = this.chartRepository
      .createQueryBuilder('charts')
      .select([
        'charts.id',
        'charts.siteId',
        'charts.chartName',
        'charts.chartDescription',
        'charts.rootNode',
        'charts.rootName',
        'charts.defaultPercentage',
        'charts.status',
        'charts.order'
      ])
      .where('charts.status = :status', { status: 'A' });

    if (siteId) {
      query.andWhere('charts.siteId = :siteId', { siteId });
    }

    query
      .orderBy('ISNULL(charts.order)', 'ASC')
      .addOrderBy('charts.order', 'ASC')
      .addOrderBy('charts.id', 'ASC')
      .cache(`charts_active_site_${siteId || 'all'}`, 300000); // Cache 5 min

    return query.getMany();
  }

  /**
   * Get chart levels for a specific chart
   * Matching PHP demo lines 85-105
   * OPTIMIZED: Explicit SELECT + cache for 5 minutes
   */
  async findChartLevels(chartId: number, levelType?: 'grouping' | 'target') {
    const query = this.chartLevelRepository
      .createQueryBuilder('cl')
      .select([
        'cl.id',
        'cl.chartId',
        'cl.level',
        'cl.levelName',
        'cl.levelType',
        'cl.status',
        'cl.order'
      ])
      .where('cl.chartId = :chartId', { chartId })
      .andWhere('cl.status = :status', { status: 'A' });

    if (levelType) {
      query.andWhere('cl.levelType = :levelType', { levelType });
    }

    query
      .orderBy('ISNULL(cl.order)', 'ASC')
      .addOrderBy('cl.order', 'ASC')
      .addOrderBy('cl.level', 'ASC')
      .cache(`chart_levels_${chartId}_${levelType || 'all'}`, 300000); // Cache 5 min

    return query.getMany();
  }
}
