import { BadRequestException } from '@nestjs/common';

export const CARD_DEFAULT_PAGE = 1;
export const CARD_DEFAULT_LIMIT = 50;
export const CARD_MAX_LIMIT = 200;
export const CARD_MAX_PAGE = 100_000;

export interface CardPagination {
  page: number;
  limit: number;
  offset: number;
}

export class CardPaginationPolicy {
  static normalize(
    page: number = CARD_DEFAULT_PAGE,
    limit: number = CARD_DEFAULT_LIMIT,
  ): CardPagination {
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > CARD_MAX_PAGE
    ) {
      throw new BadRequestException('Invalid page');
    }
    if (
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > CARD_MAX_LIMIT
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
