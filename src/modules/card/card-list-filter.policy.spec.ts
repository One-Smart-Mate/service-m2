import { BadRequestException } from '@nestjs/common';
import { CardListFilterPolicy } from './card-list-filter.policy';

describe('CardListFilterPolicy', () => {
  it('normalizes and deduplicates known card statuses', () => {
    expect(
      CardListFilterPolicy.normalize({ status: ' a, R,a, d ' }),
    ).toEqual({
      status: 'A,R,D',
      sortOption: undefined,
      dateFilterType: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  });

  it.each(['UNKNOWN', 'A,', ','])('rejects invalid status %s', (status) => {
    expect(() => CardListFilterPolicy.normalize({ status })).toThrow(
      BadRequestException,
    );
  });

  it('accepts a complete ISO date range', () => {
    expect(
      CardListFilterPolicy.normalize({
        dateFilterType: 'creation',
        startDate: '2026-09-01',
        endDate: '2026-09-24',
      }),
    ).toEqual({
      dateFilterType: 'creation',
      startDate: '2026-09-01',
      endDate: '2026-09-24',
      sortOption: undefined,
      status: undefined,
    });
  });

  it.each([
    [{ dateFilterType: 'creation', startDate: '2026-09-01' } as const],
    [
      {
        dateFilterType: 'creation',
        startDate: '2026-09-31',
        endDate: '2026-10-01',
      } as const,
    ],
    [
      {
        dateFilterType: 'due',
        startDate: '2026-10-01',
        endDate: '2026-09-01',
      } as const,
    ],
  ])('rejects an invalid date filter %#', (filters) => {
    expect(() => CardListFilterPolicy.normalize(filters)).toThrow(
      BadRequestException,
    );
  });

  it('rejects an unknown sort option', () => {
    expect(() =>
      CardListFilterPolicy.normalize({
        sortOption: 'siteCardId-desc' as never,
      }),
    ).toThrow(BadRequestException);
  });
});
