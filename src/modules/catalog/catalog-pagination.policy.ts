import { BadRequestException } from '@nestjs/common';

export const CATALOG_DEFAULT_PAGE = 1;
export const CATALOG_DEFAULT_LIMIT = 200;
export const CATALOG_MAX_LIMIT = 500;
export const CATALOG_MAX_PAGE = 100_000;

export interface CatalogPagination {
  page: number;
  limit: number;
  offset: number;
}

export class CatalogPaginationPolicy {
  static normalize(
    page: number = CATALOG_DEFAULT_PAGE,
    limit: number = CATALOG_DEFAULT_LIMIT,
  ): CatalogPagination {
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > CATALOG_MAX_PAGE
    ) {
      throw new BadRequestException('Invalid page');
    }
    if (
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > CATALOG_MAX_LIMIT
    ) {
      throw new BadRequestException('Invalid limit');
    }

    const offset = (page - 1) * limit;
    if (!Number.isSafeInteger(offset)) {
      throw new BadRequestException('Invalid pagination offset');
    }

    return { page, limit, offset };
  }
}
