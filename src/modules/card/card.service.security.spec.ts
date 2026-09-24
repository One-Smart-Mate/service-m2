import { Repository } from 'typeorm';
import { EvidenceEntity } from '../evidence/entities/evidence.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CardEntity } from './entities/card.entity';
import { CardService } from './card.service';
import { UnauthorizedException } from '@nestjs/common';
import { ValidationException } from 'src/common/exceptions/types/validation.exception';

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
    });
  });

  it('does not add a site filter for IH_sis_admin', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue(null);
    jest.mocked(cardRepository.findBy).mockResolvedValue([]);

    await service.findResponsibleCards(20, 10);

    expect(cardRepository.findBy).toHaveBeenCalledWith({ responsableId: 20 });
  });

  it('intersects mechanic sites with the requester accessible sites', async () => {
    jest.mocked(userRepository.findOne).mockResolvedValue({
      userHasSites: [{ site: { id: 2 } }, { site: { id: 3 } }],
    } as UserEntity);
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue([2]);
    jest.mocked(cardRepository.find).mockResolvedValue([]);

    await service.findUserCards(20, 10);

    expect(cardRepository.find).toHaveBeenCalledWith({
      where: {
        siteId: expect.objectContaining({ _value: [2] }),
        mechanicId: 20,
      },
      order: { siteCardId: 'DESC' },
    });
    expect(evidenceRepository.find).not.toHaveBeenCalled();
  });
});

describe('CardService create scope', () => {
  const cardRepository = {
    exists: jest.fn(),
    findOne: jest.fn(),
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
    cardRepository.exists.mockResolvedValue(false);
    cardRepository.findOne.mockResolvedValue(null);
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
      status: 'A',
      deletedAt: null,
    });
    cardTypeService.findById.mockResolvedValue({
      id: 30,
      siteId: 2,
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
});
