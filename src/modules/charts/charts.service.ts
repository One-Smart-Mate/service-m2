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
   */
  async findAll(siteId?: number) {
    const query = this.chartRepository
      .createQueryBuilder('charts')
      .where('charts.status = :status', { status: 'A' });

    if (siteId) {
      query.andWhere('charts.siteId = :siteId', { siteId });
    }

    query.orderBy('ISNULL(charts.order)', 'ASC')
      .addOrderBy('charts.order', 'ASC')
      .addOrderBy('charts.id', 'ASC');

    return query.getMany();
  }

  /**
   * Get chart levels for a specific chart
   * Matching PHP demo lines 85-105
   */
  async findChartLevels(chartId: number, levelType?: 'grouping' | 'target') {
    const query = this.chartLevelRepository
      .createQueryBuilder('cl')
      .where('cl.chartId = :chartId', { chartId })
      .andWhere('cl.status = :status', { status: 'A' });

    if (levelType) {
      query.andWhere('cl.levelType = :levelType', { levelType });
    }

    query.orderBy('ISNULL(cl.order)', 'ASC')
      .addOrderBy('cl.order', 'ASC')
      .addOrderBy('cl.level', 'ASC');

    return query.getMany();
  }
}
