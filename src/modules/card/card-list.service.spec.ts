import { IsNull } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { CardService } from './card.service';

describe('CardService paginated list', () => {
  const queryBuilder = {
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getCount: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
  };
  const cardRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const evidenceRepository = { find: jest.fn() };
  const siteService = { findById: jest.fn() };
  const service = Reflect.construct(CardService, [
    cardRepository,
    evidenceRepository,
    undefined,
    siteService,
  ]) as CardService;

  beforeEach(() => {
    jest.clearAllMocks();
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.skip.mockReturnValue(queryBuilder);
    queryBuilder.take.mockReturnValue(queryBuilder);
    siteService.findById.mockResolvedValue({ id: 2, appHistoryDays: 30 });
    queryBuilder.getCount.mockResolvedValue(1);
    queryBuilder.getMany.mockResolvedValue([
      { id: 91, siteId: 2, nodeName: 'Mixer' },
    ]);
    queryBuilder.getManyAndCount.mockResolvedValue([
      [{ id: 91, siteId: 2, nodeName: 'Mixer' }],
      1,
    ]);
    evidenceRepository.find.mockResolvedValue([]);
  });

  it('derives my cards from the requester and excludes deleted records', async () => {
    await service.findSiteCardsPaginated(2, 7, 1, 20, {
      myCards: true,
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'card.deletedAt IS NULL',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(card.creatorId = :userId OR card.mechanicId = :userId)',
      { userId: 7 },
    );
  });

  it('loads only active evidences for cards in the requested page', async () => {
    await service.findSiteCardsPaginated(2, 7, 1, 20);

    expect(evidenceRepository.find).toHaveBeenCalledWith({
      where: {
        cardId: expect.objectContaining({ _value: [91] }),
        siteId: 2,
        status: 'A',
        deletedAt: IsNull(),
      },
    });
  });

  it('does not load every site evidence for the mobile card page', async () => {
    await service.findSiteCards(2, 1, 20);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'card.deletedAt IS NULL',
    );
    expect(evidenceRepository.find).toHaveBeenCalledWith({
      where: {
        cardId: expect.objectContaining({ _value: [91] }),
        siteId: 2,
        status: 'A',
        deletedAt: IsNull(),
      },
    });
  });

  it.each([
    ['site card list', () => service.findSiteCards(2, 0, 20)],
    [
      'filtered card list',
      () => service.findSiteCardsPaginated(2, 7, 1, 201),
    ],
    ['level card list', () => service.getCardsByLevelId(2, 9, 0, 20)],
  ])('rejects unsafe pagination for the %s before querying data', async (_, action) => {
    await expect(action()).rejects.toBeInstanceOf(BadRequestException);

    expect(siteService.findById).not.toHaveBeenCalled();
    expect(cardRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it.each([
    ['unknown status', { status: 'A,UNKNOWN' }],
    [
      'incomplete dates',
      { dateFilterType: 'creation' as const, startDate: '2026-09-01' },
    ],
    [
      'inverted dates',
      {
        dateFilterType: 'due' as const,
        startDate: '2026-09-24',
        endDate: '2026-09-01',
      },
    ],
  ])('rejects %s before querying data', async (_, filters) => {
    await expect(
      service.findSiteCardsPaginated(2, 7, 1, 20, filters),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(siteService.findById).not.toHaveBeenCalled();
    expect(cardRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});
