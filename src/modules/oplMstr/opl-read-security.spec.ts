import { BadRequestException } from '@nestjs/common';
import { SITE_RESOURCE_ACCESS_KEY } from 'src/common/decorators/site-resource-access.decorator';
import { OplLevelsController } from '../oplLevels/oplLevels.controller';
import { OplLevelsService } from '../oplLevels/oplLevels.service';
import { OplMstrController } from './oplMstr.controller';
import { OplMstrService } from './oplMstr.service';

const queryBuilder = (ids: Array<string | number>) => {
  const builder: any = {
    leftJoin: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    select: jest.fn(),
    distinct: jest.fn(),
    getRawMany: jest.fn().mockResolvedValue(ids.map((id) => ({ id }))),
  };

  for (const method of [
    'leftJoin',
    'where',
    'andWhere',
    'select',
    'distinct',
  ]) {
    builder[method].mockReturnValue(builder);
  }

  return builder;
};

describe('OPL read tenant isolation', () => {
  it('protects site search, site listing and level listing with resource metadata', () => {
    const siteAccess = {
      resource: 'site',
      lookup: 'id',
      source: 'params',
      requestKey: 'siteId',
    };

    expect(
      Reflect.getMetadata(
        SITE_RESOURCE_ACCESS_KEY,
        OplMstrController.prototype.searchByTitleOrLevelName,
      ),
    ).toEqual(siteAccess);
    expect(
      Reflect.getMetadata(
        SITE_RESOURCE_ACCESS_KEY,
        OplMstrController.prototype.findBySiteId,
      ),
    ).toEqual(siteAccess);
    expect(
      Reflect.getMetadata(
        SITE_RESOURCE_ACCESS_KEY,
        OplLevelsController.prototype.findByLevelId,
      ),
    ).toEqual({
      resource: 'level',
      lookup: 'id',
      source: 'params',
      requestKey: 'levelId',
    });
  });

  it('searches by title or level name and hydrates only records from the requested site', async () => {
    const builder = queryBuilder([11, 99]);
    const oplRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(builder),
      find: jest
        .fn()
        .mockResolvedValue([
          { id: 11, siteId: 7, title: 'Hydraulic inspection', order: 1 },
        ]),
    };
    const oplDetailsRepository = {
      find: jest
        .fn()
        .mockResolvedValue([
          { id: 21, siteId: 7, oplId: 11, order: 1, type: 'pdf' },
        ]),
    };
    const oplLevelsRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 31,
          siteId: 7,
          oplId: 11,
          level: {
            id: 41,
            siteId: 7,
            name: 'Hydraulic press',
            description: 'Press line',
            levelMachineId: 'PRESS-01',
            level: 3,
            superiorId: 4,
            deletedAt: null,
          },
        },
        {
          id: 32,
          siteId: 8,
          oplId: 11,
          level: {
            id: 42,
            siteId: 8,
            name: 'Foreign press',
            description: 'Other site',
            levelMachineId: 'PRESS-99',
            level: 3,
            superiorId: 5,
            deletedAt: null,
          },
        },
      ]),
    };
    const service = new OplMstrService(
      oplRepository as any,
      oplLevelsRepository as any,
      oplDetailsRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const result = await service.searchByTitleOrLevelName(7, 'Hydraulic');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 11,
      details: [{ id: 21, siteId: 7, oplId: 11 }],
      levels: [{ id: 41, name: 'Hydraulic press' }],
    });
    expect(result[0].levels).toHaveLength(1);
    expect(builder.where).toHaveBeenCalledWith('opl.siteId = :siteId', {
      siteId: 7,
    });
    expect(oplRepository.find.mock.calls[0][0].where.siteId).toBe(7);
    expect(oplDetailsRepository.find.mock.calls[0][0].where[0].siteId).toBe(7);
  });

  it('scopes OPLs and evidence to the site of the requested level', async () => {
    const updateBuilder: any = {
      update: jest.fn(),
      set: jest.fn(),
      whereInIds: jest.fn(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    updateBuilder.update.mockReturnValue(updateBuilder);
    updateBuilder.set.mockReturnValue(updateBuilder);
    updateBuilder.whereInIds.mockReturnValue(updateBuilder);

    const oplLevelsRepository = {
      find: jest.fn().mockResolvedValue([
        { id: 31, siteId: 7, levelId: 41, oplId: 11 },
        { id: 32, siteId: 7, levelId: 41, oplId: 99 },
      ]),
    };
    const oplMstrRepository = {
      find: jest
        .fn()
        .mockResolvedValue([{ id: 11, siteId: 7, title: 'Allowed OPL' }]),
      createQueryBuilder: jest.fn().mockReturnValue(updateBuilder),
    };
    const oplDetailsRepository = {
      find: jest
        .fn()
        .mockResolvedValue([{ id: 21, siteId: 7, oplId: 11, type: 'imagen' }]),
    };
    const levelRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 41,
        siteId: 7,
        name: 'Mixer',
        description: 'Main mixer',
        levelMachineId: 'MIX-01',
        level: 3,
        superiorId: 4,
      }),
    };
    const service = new OplLevelsService(
      oplLevelsRepository as any,
      oplMstrRepository as any,
      oplDetailsRepository as any,
      levelRepository as any,
    );

    const result = await service.findOplMstrByLevelId(41);

    expect(result.map((opl) => opl.id)).toEqual([11]);
    expect(result[0]).toMatchObject({
      details: [{ id: 21, siteId: 7 }],
      levels: [{ id: 41, name: 'Mixer' }],
    });
    expect(oplMstrRepository.find.mock.calls[0][0].where.siteId).toBe(7);
    expect(oplDetailsRepository.find.mock.calls[0][0].where[0].siteId).toBe(7);
    expect(updateBuilder.whereInIds).toHaveBeenCalledWith([11]);
  });

  it('rejects an OPL-to-level relation across sites', async () => {
    const service = new OplLevelsService(
      { create: jest.fn(), save: jest.fn() } as any,
      { findOneBy: jest.fn().mockResolvedValue({ id: 11, siteId: 7 }) } as any,
      {} as any,
      { findOneBy: jest.fn().mockResolvedValue({ id: 41, siteId: 8 }) } as any,
    );

    await expect(
      service.create({ oplId: 11, levelId: 41 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
