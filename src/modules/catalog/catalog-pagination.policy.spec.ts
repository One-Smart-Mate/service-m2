import { BadRequestException } from '@nestjs/common';
import {
  CATALOG_DEFAULT_LIMIT,
  CATALOG_DEFAULT_PAGE,
  CatalogPaginationPolicy,
} from './catalog-pagination.policy';

describe('CatalogPaginationPolicy', () => {
  it('uses bounded defaults', () => {
    expect(CatalogPaginationPolicy.normalize()).toEqual({
      page: CATALOG_DEFAULT_PAGE,
      limit: CATALOG_DEFAULT_LIMIT,
      offset: 0,
    });
  });

  it.each([
    [0, 200],
    [-1, 200],
    [Number.NaN, 200],
    [1.5, 200],
    [100_001, 200],
    [1, 0],
    [1, -1],
    [1, Number.NaN],
    [1, 501],
  ])('rejects unsafe page %s and limit %s', (page, limit) => {
    expect(() => CatalogPaginationPolicy.normalize(page, limit)).toThrow(
      BadRequestException,
    );
  });

  it('calculates a stable SQL offset', () => {
    expect(CatalogPaginationPolicy.normalize(3, 50)).toEqual({
      page: 3,
      limit: 50,
      offset: 100,
    });
  });
});
