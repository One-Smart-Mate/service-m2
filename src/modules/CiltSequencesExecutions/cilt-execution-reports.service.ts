import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import { positiveDatabaseId } from '../../common/database/site-transaction';
import {
  assertSiteTimezone,
  ciltSiteDayRange,
  DEFAULT_SITE_TIMEZONE,
  parseCiltLocalDate,
} from '../../utils/cilt-timezone.utils';
import { SiteEntity } from '../site/entities/site.entity';
import { CardEntity } from '../card/entities/card.entity';
import { CiltSequencesExecutionsEntity } from './entities/ciltSequencesExecutions.entity';

export interface CiltReportFilters {
  startDate: string;
  endDate: string;
  siteId?: number;
  positionId?: number;
  levelId?: number;
}

interface ReportContext {
  query: SelectQueryBuilder<CiltSequencesExecutionsEntity>;
  formatters: Map<number, Intl.DateTimeFormat>;
}

@Injectable()
export class CiltExecutionReportsService {
  constructor(
    @InjectRepository(CiltSequencesExecutionsEntity)
    private readonly executions: Repository<CiltSequencesExecutionsEntity>,
    @InjectRepository(CardEntity)
    private readonly cards: Repository<CardEntity>,
  ) {}

  private async context(filters: CiltReportFilters): Promise<ReportContext> {
    const start = parseCiltLocalDate(filters.startDate);
    const end = parseCiltLocalDate(filters.endDate);
    if (start > end)
      throw new BadRequestException('startDate must not be after endDate');
    const sites = await this.executions.manager
      .getRepository(SiteEntity)
      .findBy({
        deletedAt: IsNull(),
        ...(filters.siteId === undefined
          ? {}
          : { id: positiveDatabaseId(filters.siteId) }),
      });
    if (filters.siteId !== undefined && !sites.length)
      throw new NotFoundException('Site not found');
    const formatters = new Map<number, Intl.DateTimeFormat>();
    const query = this.executions
      .createQueryBuilder('execution')
      .where('execution.deletedAt IS NULL');
    if (!sites.length) query.andWhere('1 = 0');
    else
      query.andWhere(
        new Brackets((scope) => {
          sites.forEach((site, index) => {
            const siteId = Number(site.id);
            const timezone = assertSiteTimezone(
              site.timezone || DEFAULT_SITE_TIMEZONE,
            );
            const { dayStart } = ciltSiteDayRange(filters.startDate, timezone);
            const { dayEnd } = ciltSiteDayRange(filters.endDate, timezone);
            formatters.set(
              siteId,
              new Intl.DateTimeFormat('en-CA', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              }),
            );
            scope.orWhere(
              `(execution.siteId = :site${index} AND execution.secuenceSchedule >= :start${index} AND execution.secuenceSchedule < :end${index})`,
              {
                [`site${index}`]: siteId,
                [`start${index}`]: dayStart,
                [`end${index}`]: new Date(dayEnd.getTime() + 1),
              },
            );
          });
        }),
      );
    for (const field of ['positionId', 'levelId'] as const) {
      if (filters[field] !== undefined)
        query.andWhere(`execution.${field} = :${field}`, {
          [field]: positiveDatabaseId(filters[field]),
        });
    }
    return { query, formatters };
  }

  private localDate(
    context: ReportContext,
    siteId: number,
    scheduledAt: Date | string,
  ): string {
    // mysql2 returns Date in UTC; handle raw strings explicitly without host TZ.
    const instant =
      scheduledAt instanceof Date
        ? scheduledAt
        : new Date(
            /(?:Z|[+-]\d{2}:?\d{2})$/i.test(scheduledAt)
              ? scheduledAt
              : `${scheduledAt.replace(' ', 'T')}Z`,
          );
    if (!Number.isFinite(instant.getTime()))
      throw new BadRequestException('Invalid stored execution schedule');
    const formatter = context.formatters.get(Number(siteId));
    if (!formatter)
      throw new BadRequestException('Execution site has no report timezone');
    const parts = Object.fromEntries(
      formatter.formatToParts(instant).map(({ type, value }) => [type, value]),
    );
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  private async daily<K extends string>(
    context: ReportContext,
    metrics: Record<K, string>,
  ): Promise<Array<{ date: string } & Record<K, number>>> {
    // Aggregate equal instants in SQL, then merge them by each site's calendar
    // date. This works without MySQL timezone tables, including DST changes.
    const rows = await context.query
      .clone()
      .select([
        'execution.siteId AS siteId',
        'execution.secuenceSchedule AS scheduledAt',
        ...Object.entries(metrics).map(
          ([name, expression]) => `${expression} AS ${name}`,
        ),
      ])
      .groupBy('execution.siteId')
      .addGroupBy('execution.secuenceSchedule')
      .getRawMany();
    const days = new Map<string, Record<string, number>>();
    for (const row of rows) {
      const date = this.localDate(context, row.siteId, row.scheduledAt);
      const day =
        days.get(date) ??
        Object.fromEntries(Object.keys(metrics).map((key) => [key, 0]));
      for (const key of Object.keys(metrics)) day[key] += Number(row[key] ?? 0);
      days.set(date, day);
    }
    return [...days]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([date, counts]) =>
          ({ date, ...counts }) as { date: string } & Record<K, number>,
      );
  }

  async execution(filters: CiltReportFilters) {
    return this.daily(await this.context(filters), {
      programmed: 'COUNT(*)',
      executed:
        'SUM(CASE WHEN execution.secuenceStart IS NOT NULL THEN 1 ELSE 0 END)',
    });
  }

  async compliance(filters: CiltReportFilters) {
    const { query } = await this.context(filters);
    const rows = await query
      .leftJoin('execution.user', 'user')
      .select([
        'user.id AS userId',
        'user.name AS userName',
        'COUNT(*) AS assigned',
        'SUM(CASE WHEN execution.secuenceStart IS NOT NULL THEN 1 ELSE 0 END) AS executed',
      ])
      .andWhere('execution.userId IS NOT NULL')
      .groupBy('user.id')
      .addGroupBy('user.name')
      .orderBy('user.name', 'ASC')
      .getRawMany();
    return rows.map((row) => ({
      userId: row.userId,
      userName: row.userName,
      assigned: Number(row.assigned),
      executed: Number(row.executed),
      compliancePercentage:
        Number(row.assigned) > 0
          ? (Number(row.executed) / Number(row.assigned)) * 100
          : 0,
    }));
  }

  async time(filters: CiltReportFilters) {
    const days = await this.daily(await this.context(filters), {
      standardTime: 'SUM(COALESCE(execution.duration, 0))',
      realTime: 'SUM(COALESCE(execution.realDuration, 0))',
      executedCount:
        'SUM(CASE WHEN execution.secuenceStart IS NOT NULL THEN 1 ELSE 0 END)',
    });
    return days.map((day) => ({
      ...day,
      standardTimeMinutes: Math.round(day.standardTime / 60),
      realTimeMinutes: Math.round(day.realTime / 60),
      efficiencyPercentage:
        day.standardTime > 0 ? (day.realTime / day.standardTime) * 100 : 0,
    }));
  }

  async anomalies(filters: CiltReportFilters) {
    const context = await this.context(filters);
    context.query.andWhere('execution.secuenceStart IS NOT NULL');
    const days = await this.daily(context, {
      totalAnomalies:
        'SUM(CASE WHEN execution.nok = 1 OR execution.amTagId > 0 THEN 1 ELSE 0 END)',
      nokAnomalies: 'SUM(CASE WHEN execution.nok = 1 THEN 1 ELSE 0 END)',
      amTagAnomalies: 'SUM(CASE WHEN execution.amTagId > 0 THEN 1 ELSE 0 END)',
      stoppageAnomalies:
        'SUM(CASE WHEN execution.stoppageReason = 1 THEN 1 ELSE 0 END)',
    });
    const links = await context.query
      .clone()
      .select([
        'execution.id AS executionId',
        'execution.amTagId AS cardId',
        'execution.siteId AS siteId',
        'execution.secuenceSchedule AS scheduledAt',
      ])
      .andWhere('execution.amTagId > 0')
      .getRawMany();
    const cards = links.length
      ? await this.cards
          .createQueryBuilder('card')
          .innerJoin(
            CiltSequencesExecutionsEntity,
            'linked',
            'linked.amTagId = card.id AND linked.siteId = card.siteId',
          )
          .where('linked.id IN (:...executionIds)', {
            executionIds: links.map((link) => link.executionId),
          })
          .andWhere('linked.deletedAt IS NULL AND card.deletedAt IS NULL')
          .distinct(true)
          .getMany()
      : [];
    const byId = new Map(cards.map((card) => [Number(card.id), card]));
    const byDate = new Map<string, Map<number, CardEntity>>();
    for (const link of links) {
      const card = byId.get(Number(link.cardId));
      if (!card || Number(card.siteId) !== Number(link.siteId)) continue;
      const date = this.localDate(context, link.siteId, link.scheduledAt);
      const dayCards = byDate.get(date) ?? new Map<number, CardEntity>();
      dayCards.set(Number(card.id), card);
      byDate.set(date, dayCards);
    }
    return days.map((day) => ({
      ...day,
      relatedCards: [...(byDate.get(day.date)?.values() ?? [])],
    }));
  }
}
