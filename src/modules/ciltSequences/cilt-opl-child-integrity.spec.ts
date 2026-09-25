import { BadRequestException } from '@nestjs/common';
import { CiltFrequenciesEntity } from '../ciltFrequencies/entities/ciltFrequencies.entity';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { CiltTypesEntity } from '../ciltTypes/entities/ciltTypes.entity';
import { OplDetailPersistence } from '../oplDetails/opl-detail.persistence';
import { OplDetailsEntity } from '../oplDetails/entities/oplDetails.entity';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { CiltSequencePersistence } from './cilt-sequence.persistence';
import { CiltSequencesEntity } from './entities/ciltSequences.entity';

const createDataSource = (repositories: Map<unknown, unknown>) => {
  const manager: any = {
    getRepository: jest.fn((entity) => repositories.get(entity)),
  };
  manager.transaction = jest.fn(async (work) => work(manager));
  return manager;
};

describe('CILT sequence and OPL detail integrity', () => {
  it('creates a sequence from same-site relations and derives duplicated fields', async () => {
    const sequenceRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 2, order: 3 }),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const siteRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 7, name: 'Test Site' }),
    };
    const masterRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 10,
        siteId: 7,
        ciltName: 'Inspection',
      }),
    };
    const frequencyRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 20,
        siteId: 7,
        frecuencyCode: 'DLY',
      }),
    };
    const typeRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 30,
        siteId: 7,
        name: 'Cleaning',
      }),
    };
    const oplRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 40, siteId: 7 }),
    };
    const dataSource = createDataSource(
      new Map<unknown, unknown>([
        [CiltSequencesEntity, sequenceRepository],
        [SiteEntity, siteRepository],
        [CiltMstrEntity, masterRepository],
        [CiltFrequenciesEntity, frequencyRepository],
        [CiltTypesEntity, typeRepository],
        [OplMstr, oplRepository],
      ]),
    );
    const persistence = new CiltSequencePersistence(dataSource as any);

    const result = await persistence.create({
      siteId: 7,
      siteName: 'Spoofed site',
      ciltMstrId: 10,
      ciltMstrName: 'Spoofed master',
      frecuencyId: 20,
      frecuencyCode: 'BAD',
      ciltTypeId: 30,
      ciltTypeName: 'Spoofed type',
      referenceOplSopId: 40,
      order: 99,
      createdAt: '2026-09-24T12:00:00.000Z',
    });

    expect(result).toMatchObject({
      siteId: 7,
      siteName: 'Test Site',
      ciltMstrId: 10,
      ciltMstrName: 'Inspection',
      frecuencyId: 20,
      frecuencyCode: 'DLY',
      ciltTypeId: 30,
      ciltTypeName: 'Cleaning',
      order: 4,
    });
    expect(masterRepository.findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: 10, siteId: 7 }),
    });
    expect(oplRepository.findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: 40, siteId: 7 }),
    });
  });

  it('rejects cross-site OPL references before persisting a sequence', async () => {
    const sequenceRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    const dataSource = createDataSource(
      new Map<unknown, unknown>([
        [CiltSequencesEntity, sequenceRepository],
        [SiteEntity, { findOne: jest.fn().mockResolvedValue({ id: 7 }) }],
        [
          CiltMstrEntity,
          { findOne: jest.fn().mockResolvedValue({ id: 10, siteId: 7 }) },
        ],
        [OplMstr, { findOne: jest.fn().mockResolvedValue(null) }],
      ]),
    );
    const persistence = new CiltSequencePersistence(dataSource as any);

    await expect(
      persistence.create({
        siteId: 7,
        ciltMstrId: 10,
        referenceOplSopId: 99,
        createdAt: '2026-09-24T12:00:00.000Z',
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(sequenceRepository.save).not.toHaveBeenCalled();
  });

  it('prevents moving an existing sequence to another site or master', async () => {
    const sequenceRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        siteId: 7,
        ciltMstrId: 10,
      }),
    };
    const dataSource = createDataSource(
      new Map([[CiltSequencesEntity, sequenceRepository]]),
    );
    const persistence = new CiltSequencePersistence(dataSource as any);
    const baseUpdate = {
      id: 1,
      updatedAt: '2026-09-24T12:00:00.000Z',
    };

    await expect(
      persistence.update({ ...baseUpdate, siteId: 8 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      persistence.update({ ...baseUpdate, ciltMstrId: 11 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('swaps sequence order atomically only inside its CILT master', async () => {
    const source = { id: 1, ciltMstrId: 10, order: 1 };
    const target = { id: 2, ciltMstrId: 10, order: 2 };
    const repository = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(source)
        .mockResolvedValueOnce(target),
      save: jest.fn(async (value) => value),
    };
    const dataSource = createDataSource(
      new Map([[CiltSequencesEntity, repository]]),
    );
    const persistence = new CiltSequencePersistence(dataSource as any);

    await persistence.updateOrder({ sequenceId: 1, newOrder: 2 });

    expect(source.order).toBe(2);
    expect(target.order).toBe(1);
    expect(repository.save).toHaveBeenCalledWith([target, source]);
    expect(repository.findOne).toHaveBeenLastCalledWith({
      where: expect.objectContaining({ ciltMstrId: 10, order: 2 }),
      lock: { mode: 'pessimistic_write' },
    });
  });

  it('derives OPL detail site/order and prevents moving it to another OPL', async () => {
    const detailRepository = {
      findOne: jest.fn().mockResolvedValueOnce({ id: 4, oplId: 40, order: 2 }),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const oplRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 40, siteId: 7 }),
    };
    const dataSource = createDataSource(
      new Map<unknown, unknown>([
        [OplDetailsEntity, detailRepository],
        [OplMstr, oplRepository],
      ]),
    );
    const persistence = new OplDetailPersistence(dataSource as any);

    const result = await persistence.create({
      siteId: 999,
      oplId: 40,
      order: 99,
      type: 'texto',
      text: 'Step one',
      createdAt: '2026-09-24T12:00:00.000Z',
    });
    expect(result).toMatchObject({ siteId: 7, oplId: 40, order: 3 });

    detailRepository.findOne.mockResolvedValueOnce({
      id: 5,
      siteId: 7,
      oplId: 40,
      order: 1,
    });
    await expect(
      persistence.update({
        id: 5,
        oplId: 41,
        updatedAt: '2026-09-24T12:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
