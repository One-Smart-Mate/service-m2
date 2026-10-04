import { IsNull, Repository } from 'typeorm';
import { EvidenceEntity } from '../evidence/entities/evidence.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CardEntity } from './entities/card.entity';
import { CardService } from './card.service';
import { UnauthorizedException } from '@nestjs/common';
import { ValidationException } from 'src/common/exceptions/types/validation.exception';
import { NotFoundCustomException } from 'src/common/exceptions/types/notFound.exception';

describe('CardService tenant-scoped collections', () => {
  const cardRepository = {
    find: jest.fn(),
    findBy: jest.fn(),
  } as unknown as Repository<CardEntity>;
  const evidenceRepository = {
    find: jest.fn(),
  } as unknown as Repository<EvidenceEntity>;
  const usersService = {
    getAccessibleSiteIds: jest.fn(),
  } as unknown as UsersService;
  const userRepository = {
    findOne: jest.fn(),
  } as unknown as Repository<UserEntity>;
  const service = Reflect.construct(CardService, [
    cardRepository,
    evidenceRepository,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    usersService,
    undefined,
    userRepository,
  ]) as CardService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters responsible cards using every site available to the requester', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue([2, 3]);
    jest.mocked(cardRepository.findBy).mockResolvedValue([]);

    await service.findResponsibleCards(20, 10);

    expect(cardRepository.findBy).toHaveBeenCalledWith({
      responsableId: 20,
      siteId: expect.objectContaining({ _value: [2, 3] }),
      deletedAt: IsNull(),
    });
  });

  it('does not add a site filter for IH_sis_admin', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue(null);
    jest.mocked(cardRepository.findBy).mockResolvedValue([]);

    await service.findResponsibleCards(20, 10);

    expect(cardRepository.findBy).toHaveBeenCalledWith({
      responsableId: 20,
      deletedAt: IsNull(),
    });
  });

  it('intersects mechanic sites with the requester accessible sites', async () => {
    jest.mocked(userRepository.findOne).mockResolvedValue({
      userHasSites: [
        { status: 'A', deletedAt: null, site: { id: 2, status: 'A' } },
        { status: 'A', deletedAt: null, site: { id: 3, status: 'A' } },
      ],
    } as UserEntity);
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue([2]);
    jest.mocked(cardRepository.find).mockResolvedValue([]);

    await service.findUserCards(20, 10);

    expect(cardRepository.find).toHaveBeenCalledWith({
      where: {
        siteId: expect.objectContaining({ _value: [2] }),
        mechanicId: 20,
        deletedAt: IsNull(),
      },
      order: { siteCardId: 'DESC' },
    });
    expect(evidenceRepository.find).not.toHaveBeenCalled();
  });
});

describe('CardService create scope', () => {
  const cardRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const siteService = { findById: jest.fn() };
  const levelService = {
    findById: jest.fn(),
    findAllLevelsBySite: jest.fn(),
    getSuperiorLevelsById: jest.fn(),
  };
  const priorityService = { findById: jest.fn() };
  const cardTypeService = { findById: jest.fn() };
  const preclassifierService = { findById: jest.fn() };
  const usersService = {
    findById: jest.fn(),
    getAccessibleSiteIds: jest.fn(),
  };
  const cardCreationPersistence = { persist: jest.fn() };
  const service = Reflect.construct(CardService, [
    cardRepository,
    {},
    undefined,
    siteService,
    levelService,
    priorityService,
    cardTypeService,
    preclassifierService,
    usersService,
    undefined,
    undefined,
    undefined,
    undefined,
    cardCreationPersistence,
  ]) as CardService;

  const createCard = (overrides: Record<string, unknown> = {}) =>
    ({
      siteId: 2,
      cardUUID: 'mobile-card-uuid',
      cardCreationDate: '2026-09-23T12:00:00.000Z',
      nodeId: 10,
      priorityId: 20,
      cardTypeId: 30,
      preclassifierId: 40,
      creatorId: 7,
      evidences: [],
      ...overrides,
    }) as never;

  beforeEach(() => {
    jest.clearAllMocks();
    cardRepository.findOneBy.mockResolvedValue(null);
    cardRepository.create.mockImplementation((card) => card);
    siteService.findById.mockResolvedValue({
      id: 2,
      status: 'A',
      deletedAt: null,
    });
    levelService.findById.mockResolvedValue({
      id: 10,
      siteId: 2,
      status: 'A',
      deletedAt: null,
    });
    priorityService.findById.mockResolvedValue({
      id: 20,
      siteId: 2,
      priorityCode: 'P1',
      priorityDays: 3,
      status: 'A',
      deletedAt: null,
    });
    cardTypeService.findById.mockResolvedValue({
      id: 30,
      siteId: 2,
      cardTypeMethodology: 'M',
      status: 'A',
      deletedAt: null,
    });
    preclassifierService.findById.mockResolvedValue({
      id: 40,
      siteId: 2,
      cardTypeId: 30,
      status: 'A',
      deletedAt: null,
    });
    usersService.findById.mockResolvedValue({
      id: 7,
      status: 'A',
      deletedAt: null,
    });
    usersService.getAccessibleSiteIds.mockResolvedValue([2]);
  });

  it('rejects catalog resources from another site', async () => {
    priorityService.findById.mockResolvedValue({
      id: 20,
      siteId: 3,
      status: 'A',
      deletedAt: null,
    });

    await expect(service.createOptimized(createCard())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(cardRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a preclassifier that does not belong to the card type', async () => {
    preclassifierService.findById.mockResolvedValue({
      id: 40,
      siteId: 2,
      cardTypeId: 31,
      status: 'A',
      deletedAt: null,
    });

    await expect(service.createOptimized(createCard())).rejects.toBeInstanceOf(
      ValidationException,
    );
    expect(cardRepository.save).not.toHaveBeenCalled();
  });

  it('rejects creation when the effective user cannot access the site', async () => {
    usersService.getAccessibleSiteIds.mockResolvedValue([3]);

    await expect(service.createOptimized(createCard())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(usersService.getAccessibleSiteIds).toHaveBeenCalledWith(7);
    expect(cardRepository.save).not.toHaveBeenCalled();
  });

  it('requires safe or unsafe for card types that use classification', async () => {
    cardTypeService.findById.mockResolvedValue({
      id: 30,
      siteId: 2,
      cardTypeMethodology: 'C',
      status: 'A',
      deletedAt: null,
    });

    await expect(
      service.createOptimized(createCard({ cardTypeValue: null })),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(cardCreationPersistence.persist).not.toHaveBeenCalled();
  });

  it('queues card notifications transactionally for the effective user', async () => {
    levelService.findById.mockResolvedValue({
      id: 10,
      siteId: 2,
      status: 'A',
      deletedAt: null,
      name: 'Machine',
      notify: 1,
      responsibleId: 8,
      responsibleName: 'Mechanic',
      assignWhileCreate: 0,
      level: 2,
      superiorId: 1,
    });
    cardTypeService.findById.mockResolvedValue({
      id: 30,
      siteId: 2,
      cardTypeMethodology: 'M',
      methodology: 'Autonomous maintenance',
      status: 'A',
      deletedAt: null,
    });
    levelService.findAllLevelsBySite.mockResolvedValue([]);
    levelService.getSuperiorLevelsById.mockReturnValue({
      area: { id: 1, name: 'Area' },
      location: 'Area / Machine',
    });
    cardCreationPersistence.persist.mockResolvedValue({
      card: { id: 91 },
      created: true,
    });

    await service.createOptimized(
      createCard({ notifyResponsible: true }),
    );

    expect(cardCreationPersistence.persist).toHaveBeenCalledWith(
      expect.objectContaining({
        creatorId: 7,
        notifications: [
          expect.objectContaining({
            deduplicationKey: 'card-created:mobile-card-uuid:site',
            payload: expect.objectContaining({
              audience: {
                type: 'site-except-user',
                siteId: 2,
                excludedUserId: 7,
              },
            }),
          }),
          expect.objectContaining({
            deduplicationKey:
              'card-created:mobile-card-uuid:responsible:8',
            payload: expect.objectContaining({
              audience: { type: 'user', userId: 8 },
            }),
          }),
        ],
      }),
    );
  });

  it('returns an existing offline card without creating or notifying again', async () => {
    const existingCard = {
      id: 90,
      siteId: 2,
      creatorId: 7,
      cardUUID: 'mobile-card-uuid',
      nodeId: 10,
      priorityId: 20,
      cardTypeId: 30,
      preclassifierId: 40,
      cardCreationDate: '2026-09-23T12:00:00.000Z',
    };
    cardRepository.findOneBy.mockResolvedValue(existingCard);

    await expect(service.createOptimized(createCard())).resolves.toBe(
      existingCard,
    );

    expect(siteService.findById).not.toHaveBeenCalled();
    expect(cardCreationPersistence.persist).not.toHaveBeenCalled();
  });

  it('rejects an offline UUID that belongs to another creator', async () => {
    cardRepository.findOneBy.mockResolvedValue({
      id: 90,
      siteId: 2,
      creatorId: 8,
      cardUUID: 'mobile-card-uuid',
    });

    await expect(service.createOptimized(createCard())).rejects.toBeInstanceOf(
      ValidationException,
    );
    expect(cardCreationPersistence.persist).not.toHaveBeenCalled();
  });

  it('rejects UUID reuse for a different offline card payload', async () => {
    cardRepository.findOneBy.mockResolvedValue({
      id: 90,
      siteId: 2,
      creatorId: 7,
      cardUUID: 'mobile-card-uuid',
      nodeId: 999,
      priorityId: 20,
      cardTypeId: 30,
      preclassifierId: 40,
    });

    await expect(service.createOptimized(createCard())).rejects.toBeInstanceOf(
      ValidationException,
    );
    expect(cardCreationPersistence.persist).not.toHaveBeenCalled();
  });

  it('synchronizes a batch independently and uses the effective user', async () => {
    cardRepository.findOneBy
      .mockResolvedValueOnce({
        id: 90,
        siteId: 2,
        creatorId: 7,
        cardUUID: 'offline-1',
        nodeId: 10,
        priorityId: 20,
        cardTypeId: 30,
        preclassifierId: 40,
        cardCreationDate: '2026-09-23T12:00:00.000Z',
      })
      .mockResolvedValueOnce({
        id: 91,
        siteId: 2,
        creatorId: 8,
        cardUUID: 'offline-2',
      });

    const result = await service.syncOfflineCards(
      [
        createCard({ cardUUID: 'offline-1', creatorId: 999 }),
        createCard({ cardUUID: 'offline-2', creatorId: 999 }),
      ],
      7,
    );

    expect(result).toEqual({
      total: 2,
      succeeded: 1,
      failed: 1,
      results: [
        expect.objectContaining({
          cardUUID: 'offline-1',
          success: true,
          outcome: 'existing',
        }),
        expect.objectContaining({
          cardUUID: 'offline-2',
          success: false,
          statusCode: 400,
        }),
      ],
    });
  });
});

describe('CardService mutation scope', () => {
  const cardRepository = { findOne: jest.fn() };
  const priorityService = { findById: jest.fn() };
  const usersService = {
    findOneById: jest.fn(),
    getAccessibleSiteIds: jest.fn(),
    getUserToken: jest.fn(),
  };
  const firebaseService = { sendMultipleMessage: jest.fn() };
  const discardReasonRepository = { findOne: jest.fn() };
  const cardMutationPersistence = {
    updatePriority: jest.fn(),
    updateMechanic: jest.fn(),
    updateCustomDueDate: jest.fn(),
    discard: jest.fn(),
  };
  const service = Reflect.construct(CardService, [
    cardRepository,
    {},
    {},
    undefined,
    undefined,
    priorityService,
    undefined,
    undefined,
    usersService,
    firebaseService,
    undefined,
    discardReasonRepository,
    undefined,
    undefined,
    undefined,
    cardMutationPersistence,
  ]) as CardService;

  const activeUser = { id: 7, name: 'Operator', status: 'A' };
  const card = {
    id: 12,
    siteId: 2,
    priorityId: 4,
    priorityCode: 'P1',
    createdAt: new Date('2026-09-23T12:00:00.000Z'),
    cardCreationDate: '2026-09-23T12:00:00.000Z',
    mechanicId: null,
  } as CardEntity;

  beforeEach(() => {
    jest.clearAllMocks();
    cardRepository.findOne.mockResolvedValue({ ...card });
    usersService.findOneById.mockResolvedValue(activeUser);
    usersService.getAccessibleSiteIds.mockResolvedValue([2]);
    usersService.getUserToken.mockResolvedValue([]);
  });

  it('rejects a priority that belongs to another site', async () => {
    priorityService.findById.mockResolvedValue({
      id: 5,
      siteId: 3,
      status: 'A',
      deletedAt: null,
    });

    await expect(
      service.updateCardPriority({ cardId: 12, priorityId: 5 }, 7),
    ).rejects.toBeInstanceOf(NotFoundCustomException);
    expect(cardMutationPersistence.updatePriority).not.toHaveBeenCalled();
  });

  it('rejects assigning a user without access to the card site', async () => {
    usersService.findOneById
      .mockResolvedValueOnce({ id: 8, name: 'Mechanic', status: 'A' })
      .mockResolvedValueOnce(activeUser);
    usersService.getAccessibleSiteIds.mockResolvedValue([3]);

    await expect(
      service.updateCardMechanic({ cardId: 12, mechanicId: 8 }, 7),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(cardMutationPersistence.updateMechanic).not.toHaveBeenCalled();
  });

  it('accepts an IH_sis_admin as a globally accessible assignee', async () => {
    usersService.findOneById
      .mockResolvedValueOnce({ id: 8, name: 'Platform Admin', status: 'A' })
      .mockResolvedValueOnce(activeUser);
    usersService.getAccessibleSiteIds.mockResolvedValue(null);
    cardMutationPersistence.updateMechanic.mockResolvedValue({
      card,
      changed: true,
      note: { id: 20 },
    });

    await service.updateCardMechanic({ cardId: 12, mechanicId: 8 }, 7);

    expect(cardMutationPersistence.updateMechanic).toHaveBeenCalled();
  });

  it('rejects custom due dates for a regular priority', async () => {
    await expect(
      service.updateCardCustomDueDate(
        { cardId: 12, customDueDate: '2026-10-01' },
        7,
      ),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(cardMutationPersistence.updateCustomDueDate).not.toHaveBeenCalled();
  });

  it('rejects calendar-overflow dates for a wildcard priority', async () => {
    cardRepository.findOne.mockResolvedValue({
      ...card,
      priorityCode: 'XX',
    });

    await expect(
      service.updateCardCustomDueDate(
        { cardId: 12, customDueDate: '2026-02-30' },
        7,
      ),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(cardMutationPersistence.updateCustomDueDate).not.toHaveBeenCalled();
  });

  it('accepts a site-global discard reason', async () => {
    discardReasonRepository.findOne.mockResolvedValue({ id: 3, siteId: null });
    cardMutationPersistence.discard.mockResolvedValue({
      ...card,
      status: 'D',
    });

    await service.discardCard(
      { cardId: 12, amDiscardReasonId: 3 },
      7,
    );

    expect(discardReasonRepository.findOne).toHaveBeenCalledWith({
      where: expect.arrayContaining([
        expect.objectContaining({ id: 3, siteId: 2 }),
        expect.objectContaining({ id: 3 }),
      ]),
    });
    expect(cardMutationPersistence.discard).toHaveBeenCalled();
  });
});
