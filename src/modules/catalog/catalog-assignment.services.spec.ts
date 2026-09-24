import { UnauthorizedException } from '@nestjs/common';
import { NotFoundCustomException } from 'src/common/exceptions/types/notFound.exception';
import { CardTypesService } from '../cardTypes/cardTypes.service';
import { LevelService } from '../level/level.service';
import { PriorityService } from '../priority/priority.service';

describe('Catalog service assignment boundaries', () => {
  const firebaseService = { sendMultipleMessage: jest.fn() };
  const usersService = {
    findOneById: jest.fn(),
    getAccessibleSiteIds: jest.fn(),
    getSiteUsersTokens: jest.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    usersService.findOneById.mockResolvedValue({
      id: 7,
      name: 'Responsible',
      email: 'responsible@example.com',
      status: 'A',
    });
    usersService.getAccessibleSiteIds.mockResolvedValue([2]);
  });

  it('rejects creating a card type with a responsible from another site', async () => {
    usersService.getAccessibleSiteIds.mockResolvedValue([3]);
    const repository = { save: jest.fn() };
    const siteService = {
      findById: jest.fn().mockResolvedValue({
        id: 2,
        siteCode: 'SITE02',
        status: 'A',
        deletedAt: null,
      }),
    };
    const service = new CardTypesService(
      repository as never,
      usersService as never,
      siteService as never,
      {} as never,
      firebaseService as never,
      {} as never,
    );

    await expect(
      service.create({ siteId: 2, responsableId: 7 } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects a level parent that belongs to another site', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue(null),
      findOneBy: jest.fn().mockResolvedValue({
        id: 20,
        siteId: 3,
        level: 1,
        status: 'A',
        deletedAt: null,
      }),
      save: jest.fn(),
    };
    const siteService = {
      findById: jest.fn().mockResolvedValue({
        id: 2,
        companyId: 1,
        status: 'A',
        deletedAt: null,
      }),
    };
    const service = new LevelService(
      repository as never,
      {} as never,
      usersService as never,
      siteService as never,
      firebaseService as never,
    );

    await expect(
      service.create({
        siteId: 2,
        superiorId: 20,
        responsibleId: null,
        levelMachineId: 'MACHINE-1',
        name: 'Child',
        description: 'Child level',
        notify: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundCustomException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects creating a priority for an inactive site', async () => {
    const repository = { save: jest.fn() };
    const siteService = {
      findById: jest.fn().mockResolvedValue({
        id: 2,
        siteCode: 'SITE02',
        status: 'I',
        deletedAt: null,
      }),
    };
    const service = new PriorityService(
      repository as never,
      siteService as never,
      usersService as never,
      firebaseService as never,
    );

    await expect(service.create({ siteId: 2 } as never)).rejects.toBeInstanceOf(
      NotFoundCustomException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});
