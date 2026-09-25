import { BadRequestException } from '@nestjs/common';
import { CiltMstrController } from './ciltMstr.controller';
import { CiltMasterPersistence } from './cilt-master.persistence';
import { CiltMstrEntity } from './entities/ciltMstr.entity';
import { OplMstrController } from '../oplMstr/oplMstr.controller';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { OplMasterPersistence } from '../oplMstr/opl-master.persistence';
import { OplTypes } from '../oplTypes/entities/oplTypes.entity';
import { UserEntity } from '../users/entities/user.entity';

const transactionManager = (repositories: Map<unknown, unknown>) => {
  const manager: any = {
    getRepository: jest.fn((entity) => repositories.get(entity)),
  };
  manager.transaction = jest.fn(async (work) => work(manager));
  return manager;
};

describe('CILT and OPL master integrity', () => {
  it('forwards the effective Fast Password identity from both controllers', async () => {
    const ciltService = {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      cloneCiltMaster: jest.fn().mockResolvedValue({ id: 2 }),
    };
    const oplService = {
      create: jest.fn().mockResolvedValue({ id: 3 }),
    };
    const ciltController = new CiltMstrController(ciltService as any);
    const oplController = new OplMstrController(oplService as any);
    const request = { user: { id: 202, actorId: 101 } };

    await ciltController.create({ siteId: 7 } as any, request);
    await ciltController.cloneCiltMaster(1, request);
    await oplController.create(
      {
        siteId: 7,
        title: 'Safe work',
        createdAt: '2026-09-24T12:00:00.000Z',
      },
      request,
    );

    expect(ciltService.create).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 7 }),
      202,
    );
    expect(ciltService.cloneCiltMaster).toHaveBeenCalledWith(1, 202);
    expect(oplService.create).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 7 }),
      202,
    );
  });

  it('creates a CILT transactionally using the authenticated creator and server order', async () => {
    const saved: any[] = [];
    const ciltRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 8, siteId: 7, order: 4 }),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => {
        saved.push(value);
        return value;
      }),
    };
    const userRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 202, name: 'Fast User' }),
    };
    const manager = transactionManager(
      new Map<unknown, unknown>([
        [CiltMstrEntity, ciltRepository],
        [UserEntity, userRepository],
      ]),
    );
    const service = new CiltMasterPersistence(manager as any);

    const result = await service.create(
      {
        siteId: 7,
        ciltName: 'Inspection',
        creatorId: 999,
        creatorName: 'Spoofed',
        order: 99,
      },
      202,
    );

    expect(manager.transaction).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      siteId: 7,
      creatorId: 202,
      creatorName: 'Fast User',
      order: 5,
    });
    expect(saved).toHaveLength(1);
  });

  it('swaps OPL masters from the same site atomically using the correct repository', async () => {
    const source = { id: 11, siteId: 7, order: 1, deletedAt: null };
    const target = { id: 12, siteId: 7, order: 2, deletedAt: null };
    const oplRepository = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(source)
        .mockResolvedValueOnce(target),
      save: jest.fn(async (value) => value),
    };
    const manager = transactionManager(new Map([[OplMstr, oplRepository]]));
    const service = new OplMasterPersistence(manager as any);

    const result = await service.updateOrder({ oplId: 11, newOrder: 2 });

    expect(result).toBe(source);
    expect(source.order).toBe(2);
    expect(target.order).toBe(1);
    expect(oplRepository.save).toHaveBeenCalledWith([target, source]);
    expect(manager.transaction).toHaveBeenCalledTimes(1);
  });

  it('creates an OPL with trusted authorship and rejects a type from another site', async () => {
    const oplRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 5, siteId: 7, order: 2 }),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const userRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 202, name: 'Fast User' }),
    };
    const oplTypeRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 9,
        siteId: 7,
        documentType: 'SOP',
      }),
    };
    const manager = transactionManager(
      new Map<unknown, unknown>([
        [OplMstr, oplRepository],
        [UserEntity, userRepository],
        [OplTypes, oplTypeRepository],
      ]),
    );
    const service = new OplMasterPersistence(manager as any);

    const result = await service.create(
      {
        title: 'Lockout procedure',
        siteId: 7,
        creatorId: 999,
        creatorName: 'Spoofed',
        oplTypeId: 9,
        createdAt: '2026-09-24T12:00:00.000Z',
      },
      202,
    );

    expect(result).toMatchObject({
      siteId: 7,
      creatorId: 202,
      creatorName: 'Fast User',
      order: 3,
      oplTypeId: 9,
      oplType: 'SOP',
    });
    expect(oplTypeRepository.findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: 9, siteId: 7 }),
    });

    oplTypeRepository.findOne.mockResolvedValueOnce(null);
    await expect(
      service.create(
        {
          title: 'Foreign type',
          siteId: 7,
          oplTypeId: 99,
          createdAt: '2026-09-24T12:00:00.000Z',
        },
        202,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('does not allow a CILT or OPL master to move across sites', async () => {
    const ciltRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 1, siteId: 7 }),
    };
    const ciltManager = transactionManager(
      new Map([[CiltMstrEntity, ciltRepository]]),
    );
    const ciltService = new CiltMasterPersistence(ciltManager as any);

    const oplRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 2, siteId: 7 }),
    };
    const oplManager = transactionManager(new Map([[OplMstr, oplRepository]]));
    const oplService = new OplMasterPersistence(oplManager as any);

    await expect(
      ciltService.update({
        id: 1,
        siteId: 8,
        dateOfLastUsed: '2026-09-24T12:00:00.000Z',
        updatedAt: '2026-09-24T12:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      oplService.update({
        id: 2,
        siteId: 8,
        updatedAt: '2026-09-24T12:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
