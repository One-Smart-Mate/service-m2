import { CardTypesService } from '../cardTypes/cardTypes.service';
import { LevelService } from '../level/level.service';
import { PreclassifierService } from '../preclassifier/preclassifier.service';
import { PriorityService } from '../priority/priority.service';
import { NotFoundCustomException } from 'src/common/exceptions/types/notFound.exception';

describe('Catalog service lifecycle', () => {
  const usersService = {
    getSiteUsersTokens: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
  };
  const firebaseService = { sendMultipleMessage: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    usersService.getSiteUsersTokens.mockResolvedValue([]);
  });

  it('reactivates a priority before notifying mobile clients', async () => {
    const priority = {
      id: 4,
      siteId: 2,
      priorityCode: 'P1',
      priorityDescription: 'Urgent',
      priorityDays: 1,
      status: 'I',
      deletedAt: new Date('2026-09-20T12:00:00.000Z'),
      updatedAt: new Date(0),
    };
    const priorityRepository = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(priority)
        .mockResolvedValueOnce(null),
      save: jest.fn(async (value) => value),
    };
    const service = new PriorityService(
      priorityRepository as never,
      {} as never,
      usersService as never,
      firebaseService as never,
    );

    await service.update({
      id: 4,
      priorityCode: 'P1',
      priorityDescription: 'Urgent',
      priorityDays: 1,
      status: 'A',
    });

    expect(priorityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'A', deletedAt: null }),
    );
    expect(priorityRepository.save.mock.invocationCallOrder[0]).toBeLessThan(
      usersService.getSiteUsersTokens.mock.invocationCallOrder[0],
    );
  });

  it('does not fail a persisted priority when push notification fails', async () => {
    const priorityRepository = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({
          id: 4,
          siteId: 2,
          priorityCode: 'P1',
          status: 'A',
          deletedAt: null,
        })
        .mockResolvedValueOnce(null),
      save: jest.fn(async (value) => value),
    };
    usersService.getSiteUsersTokens.mockResolvedValue(['token']);
    firebaseService.sendMultipleMessage.mockRejectedValue(
      new Error('push unavailable'),
    );
    const service = new PriorityService(
      priorityRepository as never,
      {} as never,
      usersService as never,
      firebaseService as never,
    );
    (service as any).logger.warn = jest.fn();

    await expect(
      service.update({
        id: 4,
        priorityCode: 'P1',
        priorityDescription: 'Urgent',
        priorityDays: 1,
        status: 'A',
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 4 }));
    expect(priorityRepository.save).toHaveBeenCalled();
  });

  it('does not create a preclassifier under an inactive card type', async () => {
    const repository = { save: jest.fn() };
    const cardTypeService = {
      findById: jest.fn().mockResolvedValue({
        id: 8,
        siteId: 2,
        status: 'I',
        deletedAt: new Date(),
      }),
    };
    const service = new PreclassifierService(
      repository as never,
      cardTypeService as never,
      usersService as never,
      firebaseService as never,
    );

    await expect(
      service.create({ cardTypeId: 8 } as never),
    ).rejects.toBeInstanceOf(NotFoundCustomException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('updates card type and existing card colors in one transaction', async () => {
    const cardType = {
      id: 8,
      siteId: 2,
      color: 'FFFFFF',
      status: 'I',
      deletedAt: new Date(),
      updatedAt: new Date(0),
    };
    const manager = {
      save: jest.fn(async (_entity, value) => value),
      update: jest.fn().mockResolvedValue({ affected: 3 }),
    };
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(cardType),
      manager: {
        transaction: jest.fn((callback) => callback(manager)),
      },
    };
    const service = new CardTypesService(
      repository as never,
      usersService as never,
      {} as never,
      {} as never,
      firebaseService as never,
      {} as never,
    );

    const result = await service.update({
      id: 8,
      methodology: 'Maintenance',
      name: 'Card type',
      description: 'Description',
      color: '00FF00',
      status: 'A',
    });

    expect(repository.manager.transaction).toHaveBeenCalledTimes(1);
    expect(manager.save).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ status: 'A', deletedAt: null }),
    );
    expect(manager.update).toHaveBeenCalledWith(
      expect.any(Function),
      { cardTypeId: 8 },
      { cardTypeColor: '00FF00' },
    );
    expect(result.updatedCardsCount).toBe(3);
  });

  it('reactivates a level hierarchy atomically', async () => {
    const level = {
      id: 10,
      siteId: 2,
      status: 'I',
      deletedAt: new Date(),
      updatedAt: new Date(0),
      responsibleId: null,
    };
    const manager = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      save: jest.fn(async (_entity, value) => value),
    };
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(level),
      findOne: jest.fn(),
      query: jest.fn().mockResolvedValue([{ id: 10 }, { id: 11 }]),
      manager: {
        transaction: jest.fn((callback) => callback(manager)),
      },
    };
    const service = new LevelService(
      repository as never,
      {} as never,
      usersService as never,
      {} as never,
      firebaseService as never,
    );

    await service.update({
      id: 10,
      responsibleId: null,
      name: 'Area',
      description: 'Area description',
      levelMachineId: null,
      notify: 1,
      status: 'A',
    });

    expect(repository.manager.transaction).toHaveBeenCalledTimes(1);
    expect(manager.update).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Object),
      expect.objectContaining({ status: 'A', deletedAt: null }),
    );
    expect(manager.save).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ id: 10, status: 'A', deletedAt: null }),
    );
  });
});
