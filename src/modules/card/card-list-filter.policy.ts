import { BadRequestException } from '@nestjs/common';

export const CARD_LIST_STATUSES = ['A', 'P', 'V', 'C', 'D', 'R'] as const;
export type CardListStatus = (typeof CARD_LIST_STATUSES)[number];

export const CARD_LIST_SORT_OPTIONS = [
  'dueDate-asc',
  'dueDate-desc',
  'creationDate-asc',
  'creationDate-desc',
] as const;
export type CardListSortOption = (typeof CARD_LIST_SORT_OPTIONS)[number];
export type CardListDateFilterType = 'creation' | 'due';

export interface CardListFilters {
  searchText?: string;
  cardNumber?: string;
  location?: string;
  levelMachineId?: string;
  creator?: string;
  resolver?: string;
  dateFilterType?: CardListDateFilterType | '';
  startDate?: string;
  endDate?: string;
  sortOption?: CardListSortOption | '';
  status?: string;
  myCards?: boolean;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export class CardListFilterPolicy {
  static normalize(filters?: CardListFilters): CardListFilters | undefined {
    if (!filters) {
      return undefined;
    }

    const status = this.normalizeStatus(filters.status);
    const sortOption = this.normalizeSortOption(filters.sortOption);
    const dateRange = this.normalizeDateRange(
      filters.dateFilterType,
      filters.startDate,
      filters.endDate,
    );

    return {
      ...filters,
      status,
      sortOption,
      ...dateRange,
    };
  }

  private static normalizeStatus(status?: string): string | undefined {
    if (status === undefined || status.trim() === '') {
      return undefined;
    }

    const statuses = [
      ...new Set(status.split(',').map((value) => value.trim().toUpperCase())),
    ];
    if (
      statuses.some(
        (value) =>
          !CARD_LIST_STATUSES.includes(value as CardListStatus),
      )
    ) {
      throw new BadRequestException('Invalid card status filter');
    }

    return statuses.join(',');
  }

  private static normalizeSortOption(
    sortOption?: CardListSortOption | '',
  ): CardListSortOption | undefined {
    if (sortOption === undefined || sortOption === '') {
      return undefined;
    }
    if (!CARD_LIST_SORT_OPTIONS.includes(sortOption)) {
      throw new BadRequestException('Invalid card sort option');
    }

    return sortOption;
  }

  private static normalizeDateRange(
    dateFilterType?: CardListDateFilterType | '',
    startDate?: string,
    endDate?: string,
  ): Pick<CardListFilters, 'dateFilterType' | 'startDate' | 'endDate'> {
    const hasAnyDateFilter = Boolean(dateFilterType || startDate || endDate);
    if (!hasAnyDateFilter) {
      return {
        dateFilterType: undefined,
        startDate: undefined,
        endDate: undefined,
      };
    }

    if (!dateFilterType || !startDate || !endDate) {
      throw new BadRequestException('Incomplete card date filter');
    }
    if (dateFilterType !== 'creation' && dateFilterType !== 'due') {
      throw new BadRequestException('Invalid card date filter type');
    }

    const startTimestamp = this.parseDate(startDate, 'startDate');
    const endTimestamp = this.parseDate(endDate, 'endDate');
    if (startTimestamp > endTimestamp) {
      throw new BadRequestException('Invalid card date range');
    }

    return { dateFilterType, startDate, endDate };
  }

  private static parseDate(value: string, field: string): number {
    if (!ISO_DATE_PATTERN.test(value) && !ISO_DATE_TIME_PATTERN.test(value)) {
      throw new BadRequestException(`Invalid ${field}`);
    }

    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) {
      throw new BadRequestException(`Invalid ${field}`);
    }

    if (ISO_DATE_PATTERN.test(value)) {
      const parsed = new Date(timestamp);
      if (parsed.toISOString().slice(0, 10) !== value) {
        throw new BadRequestException(`Invalid ${field}`);
      }
    }

    return timestamp;
  }
}
