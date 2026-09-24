import { IsNull } from 'typeorm';
import { CardService } from './card.service';

describe('CardService read integrity', () => {
  const queryBuilder = {
    select: jest.fn(),
    leftJoin: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    groupBy: jest.fn(),
    addGroupBy: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getCount: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getRawMany: jest.fn(),
  };
  const cardRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
    find: jest.fn(),
    findBy: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };
  const evidenceRepository = {
    find: jest.fn(),
    findBy: jest.fn(),
  };
  const cardNoteRepository = { find: jest.fn() };
  const siteService = { findById: jest.fn() };
  const userService = { getAccessibleSiteIds: jest.fn() };
  const userRepository = { findOne: jest.fn() };
  const service = Reflect.construct(CardService, [
    cardRepository,
    evidenceRepository,
    cardNoteRepository,
    siteService,
    undefined,
    undefined,
    undefined,
    undefined,
    userService,
    undefined,
    userRepository,
  ]) as CardService;

  beforeEach(() => {
    jest.clearAllMocks();
    for (const method of [
      'select',
      'leftJoin',
      'where',
      'andWhere',
      'groupBy',
      'addGroupBy',
      'orderBy',
      'skip',
      'take',
    ] as const) {
      queryBuilder[method].mockReturnValue(queryBuilder);
    }
    queryBuilder.getCount.mockResolvedValue(0);
    queryBuilder.getMany.mockResolvedValue([]);
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
    queryBuilder.getRawMany.mockResolvedValue([]);
    cardRepository.find.mockResolvedValue([]);
    cardRepository.findBy.mockResolvedValue([]);
    evidenceRepository.find.mockResolvedValue([]);
    evidenceRepository.findBy.mockResolvedValue([]);
    cardNoteRepository.find.mockResolvedValue([]);
    siteService.findById.mockResolvedValue({ id: 2, appHistoryDays: 30 });
  });

  it('does not resolve a soft-deleted card or evidence by UUID', async () => {
    cardRepository.findOneBy.mockResolvedValue({
      id: 10,
      siteId: 2,
      nodeName: 'Mixer',
    });

    await service.findCardByUUID('card-uuid');

    expect(cardRepository.findOneBy).toHaveBeenCalledWith({
      cardUUID: 'card-uuid',
      deletedAt: IsNull(),
    });
    expect(evidenceRepository.findBy).toHaveBeenCalledWith({
      cardId: 10,
      siteId: 2,
      status: 'A',
      deletedAt: IsNull(),
    });
  });

  it('does not return deleted notes or notes from a deleted UUID', async () => {
    cardRepository.findOne.mockResolvedValue({ id: 10 });

    await service.findCardNotesByUUID('card-uuid');

    expect(cardRepository.findOne).toHaveBeenCalledWith({
      where: { cardUUID: 'card-uuid', deletedAt: IsNull() },
    });
    expect(cardNoteRepository.find).toHaveBeenCalledWith({
      where: { cardId: 10, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  });

  it('keeps global admin reads unfiltered by assignments but excludes deleted cards', async () => {
    userService.getAccessibleSiteIds.mockResolvedValue(null);

    await service.findResponsibleCards(8, 1);

    expect(cardRepository.findBy).toHaveBeenCalledWith({
      responsableId: 8,
      deletedAt: IsNull(),
    });
  });

  it('returns only active non-deleted evidences for a site', async () => {
    await service.findAllEvidences(2);

    expect(evidenceRepository.find).toHaveBeenCalledWith({
      where: {
        siteId: 2,
        status: 'A',
        deletedAt: IsNull(),
      },
    });
  });

  it('allows a global admin to count non-deleted site cards', async () => {
    userService.getAccessibleSiteIds.mockResolvedValue(null);

    await expect(service.countSiteCards(2, 1)).resolves.toEqual({ total: 0 });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'card.deletedAt IS NULL',
    );
  });

  const aggregateReads: Array<[string, () => Promise<unknown>]> = [
    ['preclassifiers', () => service.findSiteCardsGroupedByPreclassifier(2)],
    ['methodologies', () => service.findSiteCardsGroupedByMethodology(2)],
    ['areas', () => service.findSiteCardsGroupedByArea(2)],
    ['area details', () => service.findSiteCardsGroupedByAreaMore(2)],
    ['machines', () => service.findSiteCardsGroupedByMachine(2)],
    ['area machines', () => service.findAreaCardsGroupedByMachine(2, 4)],
    ['creators', () => service.findSiteCardsGroupedByCreator(2)],
    ['mechanics', () => service.findSiteCardsGroupedByMechanic(2)],
    ['definitive users', () => service.findSiteCardsGroupedByDefinitiveUser(2)],
    ['weeks', () => service.findSiteCardsGroupedByWeeks(2)],
    [
      'calendar',
      () => service.findCardsForCalendar(2, '2026-09-01', '2026-09-30'),
    ],
    ['discarded cards', () => service.findSiteDiscardedCardsGroupedByUser(2)],
  ];

  it.each(aggregateReads)(
    'excludes soft-deleted cards from %s reads',
    async (_, action) => {
      await action();

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'card.deletedAt IS NULL',
      );
    },
  );
});
