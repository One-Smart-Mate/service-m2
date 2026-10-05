import { LevelEntity } from '../level/entities/level.entity';
import { UsersPositionsEntity } from '../users/entities/users.positions.entity';
import { CiltMstrPositionLevelsEntity } from '../ciltMstrPositionLevels/entities/ciltMstrPositionLevels.entity';
import { CiltSecuencesScheduleEntity } from '../ciltSecuencesSchedule/entities/ciltSecuencesSchedule.entity';
import { BadRequestException } from '@nestjs/common';
import { CiltExecutionPersistence } from './cilt-execution.persistence';
import { CiltSequencesExecutionsEntity } from './entities/ciltSequencesExecutions.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { OplMstr } from '../oplMstr/entities/oplMstr.entity';
import { PositionEntity } from '../position/entities/position.entity';
import { UserEntity } from '../users/entities/user.entity';
import { NotificationOutboxEntity } from '../notifications/entities/notification-outbox.entity';
import { sanitizeExecutionRelations } from './cilt-execution-relations.policy';

describe('CILT transactional identity and references', () => {
  const input = {
    siteId: 7,
    ciltId: 1,
    ciltSecuenceId: 2,
    userId: 3,
    levelId: 4,
    positionId: 5,
    secuenceSchedule: new Date('2026-10-04T08:00:00Z'),
    status: 'A',
    referenceOplSopId: null,
  };
  const schedule = {
    id: 9,
    siteId: 7,
    ciltId: 1,
    secuenceId: 2,
    status: 'A',
    schedule: '08:00:00',
  } as CiltSecuencesScheduleEntity;
  const provenance = { assignmentId: 7, schedule };
  let persistence: CiltExecutionPersistence;
  let repository: any;
  let manager: any;
  beforeEach(() => {
    repository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn((value) => Promise.resolve(value)),
    };
    const queued = new Set<string>();
    manager = {
      getRepository: jest.fn(() => repository),
      findOne: jest.fn((entity) =>
        Promise.resolve(
          entity === CiltSecuencesScheduleEntity ? schedule : { id: 7 },
        ),
      ),
      exists: jest.fn((entity, options) =>
        Promise.resolve(
          entity === NotificationOutboxEntity
            ? queued.has(options.where.deduplicationKey)
            : true,
        ),
      ),
      create: jest.fn((_entity, value) => value),
      save: jest.fn((entity, values) => {
        if (entity === NotificationOutboxEntity)
          values.forEach((value) => queued.add(value.deduplicationKey));
        return Promise.resolve(values);
      }),
    };
    persistence = new CiltExecutionPersistence({
      transaction: (isolationOrWork, work?) =>
        (work ?? isolationOrWork)(manager),
    } as never);
  });
  it('locks the site before looking up the full schedule identity and assigning its folio', async () => {
    repository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ siteExecutionId: '20' });
    const saved = await persistence.create(input, true, undefined, provenance);
    expect(manager.findOne).toHaveBeenNthCalledWith(
      1,
      SiteEntity,
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
    expect(repository.findOne).toHaveBeenNthCalledWith(1, {
      where: expect.objectContaining({
        siteId: 7,
        levelId: 4,
        positionId: 5,
        userId: 3,
        secuenceSchedule: input.secuenceSchedule,
      }),
    });
    expect(saved.siteExecutionId).toBe(21);
  });
  it('returns an existing schedule without resetting completion or allocating a new folio', async () => {
    const existing = { ...input, id: 22, status: 'R', siteExecutionId: 20 };
    repository.findOne.mockResolvedValue(existing);
    await expect(
      persistence.create(input, true, undefined, provenance),
    ).resolves.toBe(existing);
    expect(repository.save).not.toHaveBeenCalled();
  });
  it('keeps simultaneous generation idempotent while preserving distinct levels', async () => {
    const rows: any[] = [];
    repository.findOne.mockImplementation(({ where, order }) =>
      Promise.resolve(
        order
          ? (rows.at(-1) ?? null)
          : (rows.find((row) =>
              Object.entries(where).every(([key, value]) =>
                key === 'secuenceSchedule'
                  ? row[key].getTime() === (value as Date).getTime()
                  : row[key] === value,
              ),
            ) ?? null),
      ),
    );
    repository.save.mockImplementation((row) => {
      rows.push(row);
      return Promise.resolve(row);
    });
    // Model the serialization guaranteed by the site row lock, without using a database.
    let previous = Promise.resolve();
    const transaction = (isolationOrWork, callback?) => {
      const fn = callback ?? isolationOrWork;
      const work = previous.then(() => fn(manager));
      previous = work.then(() => undefined);
      return work;
    };
    const service = new CiltExecutionPersistence({ transaction } as never);
    await Promise.all(
      Array.from({ length: 10 }, () =>
        service.create(input, true, undefined, provenance),
      ),
    );
    await service.create({ ...input, levelId: 6 }, true, undefined, provenance);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.siteExecutionId)).toEqual([1, 2]);
    expect(rows.map((row) => row.levelId)).toEqual([4, 6]);
  });
  it('rejects a removed schedule before saving a stale generator snapshot', async () => {
    manager.findOne.mockImplementation((entity) =>
      Promise.resolve(
        entity === CiltSecuencesScheduleEntity ? null : { id: 7 },
      ),
    );
    await expect(
      persistence.create(input, true, undefined, provenance),
    ).rejects.toThrow('Schedule changed');
    expect(repository.save).not.toHaveBeenCalled();
  });
  it('rejects a changed schedule without relying on second-resolution updatedAt', async () => {
    manager.findOne.mockImplementation((entity) =>
      Promise.resolve(
        entity === CiltSecuencesScheduleEntity
          ? { ...schedule, toleranceBeforeMinutes: 10 }
          : { id: 7 },
      ),
    );
    await expect(
      persistence.create(input, true, undefined, provenance),
    ).rejects.toThrow('Schedule changed');
  });
  it.each([CiltMstrPositionLevelsEntity, UsersPositionsEntity])(
    'rejects a withdrawn assignment before saving',
    async (entity) => {
      manager.findOne.mockImplementation((candidate) =>
        Promise.resolve(
          candidate === entity
            ? null
            : candidate === CiltSecuencesScheduleEntity
              ? schedule
              : { id: 7 },
        ),
      );
      await expect(
        persistence.create(input, true, undefined, provenance),
      ).rejects.toThrow('assignment is no longer active');
      expect(repository.save).not.toHaveBeenCalled();
    },
  );
  it('rejects a template edited after the generator took its snapshot', async () => {
    await expect(
      persistence.create(input, true, undefined, {
        ...provenance,
        sequence: { standardTime: 30 } as any,
      }),
    ).rejects.toThrow('Sequence template changed');
    expect(repository.save).not.toHaveBeenCalled();
  });
  it.each([PositionEntity, LevelEntity])(
    'rejects a position or level deactivated during generation',
    async (entity) => {
      manager.findOne.mockImplementation((candidate) =>
        Promise.resolve(
          candidate === entity
            ? null
            : candidate === CiltSecuencesScheduleEntity
              ? schedule
              : { id: 7 },
        ),
      );
      await expect(
        persistence.create(input, true, undefined, provenance),
      ).rejects.toThrow('position and level must be active');
      expect(repository.save).not.toHaveBeenCalled();
    },
  );
  it('rejects a foreign OPL before saving', async () => {
    manager.findOne.mockImplementation((entity) =>
      Promise.resolve(
        entity === OplMstr
          ? null
          : entity === CiltSecuencesScheduleEntity
            ? schedule
            : { id: 7 },
      ),
    );
    await expect(
      persistence.create(
        { ...input, referenceOplSopId: 99 },
        true,
        undefined,
        provenance,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });
  it.each(['siteId', 'levelId', 'positionId', 'userId', 'siteExecutionId'])(
    'keeps execution %s immutable',
    async (field) => {
      repository.findOne.mockResolvedValue({
        ...input,
        id: 22,
        siteExecutionId: 1,
      });
      await expect(persistence.update({ id: 22, [field]: 99 })).rejects.toThrow(
        BadRequestException,
      );
    },
  );
  it('queues a stoppage only once and uses the responsible user of the position ID', async () => {
    const row = { ...input, id: 22, stoppageReason: false };
    repository.findOne.mockResolvedValue(row);
    manager.findOne.mockImplementation((entity, options) =>
      Promise.resolve(
        entity === PositionEntity
          ? {
              id: options.where.id,
              siteId: 7,
              nodeResponsableId: 9,
              name: 'Press',
            }
          : entity === UserEntity
            ? { id: 9, email: 'user@example.com', translation: 'ES' }
            : { id: 7 },
      ),
    );
    await persistence.update({ id: 22, stoppageReason: true });
    expect(manager.findOne).toHaveBeenCalledWith(
      PositionEntity,
      expect.objectContaining({
        where: expect.objectContaining({ id: 5, siteId: 7 }),
      }),
    );
    expect(manager.save).toHaveBeenCalledWith(
      NotificationOutboxEntity,
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({
            audience: { type: 'user', userId: 9 },
          }),
        }),
        expect.objectContaining({
          payload: expect.objectContaining({
            email: expect.objectContaining({ userId: 9 }),
          }),
        }),
      ]),
    );
    await persistence.update({ id: 22, stoppageReason: true });
    expect(manager.save).toHaveBeenCalledTimes(1);
  });
  it('queues the first reported stoppage even when the sequence template already required a stop', async () => {
    repository.findOne.mockResolvedValue({
      ...input,
      id: 22,
      stoppageReason: true,
    });
    manager.findOne.mockImplementation((entity) =>
      Promise.resolve(
        entity === PositionEntity
          ? { id: 5, siteId: 7, nodeResponsableId: 9 }
          : entity === UserEntity
            ? { id: 9 }
            : { id: 7 },
      ),
    );
    await persistence.update({ id: 22, stoppageReason: true });
    expect(manager.save).toHaveBeenCalledWith(
      NotificationOutboxEntity,
      expect.arrayContaining([
        expect.objectContaining({ deduplicationKey: 'cilt-stoppage:22:0' }),
      ]),
    );
  });

  it('suppresses foreign OPL data in legacy execution reads', () => {
    const row = {
      siteId: 7,
      referenceOplSop: { id: 99, siteId: 8 },
      remediationOplSop: { id: 11, siteId: 7 },
    } as CiltSequencesExecutionsEntity;
    expect(sanitizeExecutionRelations(row).referenceOplSop).toBeNull();
    expect(row.remediationOplSop.id).toBe(11);
  });
});
