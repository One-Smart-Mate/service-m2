import { BadRequestException } from '@nestjs/common';
import {
  CARD_DEFAULT_LIMIT,
  CARD_DEFAULT_PAGE,
  CardPaginationPolicy,
} from './card-pagination.policy';

describe('CardPaginationPolicy', () => {
  it('uses the mobile card list defaults', () => {
    expect(CardPaginationPolicy.normalize()).toEqual({
      page: CARD_DEFAULT_PAGE,
      limit: CARD_DEFAULT_LIMIT,
      offset: 0,
    });
  });

  it.each([
    [0, 50],
    [-1, 50],
    [Number.NaN, 50],
    [1.5, 50],
    [100_001, 50],
    [1, 0],
    [1, -1],
    [1, Number.NaN],
    [1, 201],
  ])('rejects unsafe page %s and limit %s', (page, limit) => {
    expect(() => CardPaginationPolicy.normalize(page, limit)).toThrow(
      BadRequestException,
    );
  });

  it('calculates a stable database offset', () => {
    expect(CardPaginationPolicy.normalize(3, 50)).toEqual({
      page: 3,
      limit: 50,
      offset: 100,
    });
  });
});
