import { ConflictException } from '@nestjs/common';
import { CiltSequencesExecutionsEvidencesService } from './ciltSequencesExecutionsEvidences.service';
import { CiltSequencesExecutionsEvidencesEntity } from './entities/ciltSequencesExecutionsEvidences.entity';
import { CiltSequencesExecutionsEntity } from '../CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';

describe('CILT evidence lifecycle', () => {
  let execution: any;
  let repository: any;
  let manager: any;
  let service: CiltSequencesExecutionsEvidencesService;
  const dto = {
    ciltSequencesExecutionsId: 10,
    evidenceUrl: 'https://example.com/evidence',
    createdAt: '2026-10-04T12:00:00Z',
  };
  beforeEach(() => {
    execution = {
      id: 10,
      siteId: 7,
      positionId: 8,
      ciltId: 9,
      status: 'A',
      secuenceStart: new Date(),
    };
    repository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn((value) => value),
      softDelete: jest.fn(),
    };
    manager = {
      findOne: jest.fn((entity) =>
        Promise.resolve(
          entity === CiltSequencesExecutionsEntity
            ? execution
            : { id: 20, ciltSequencesExecutionsId: 10 },
        ),
      ),
      getRepository: jest.fn(() => repository),
    };
    service = new CiltSequencesExecutionsEvidencesService(
      { transaction: (_isolation, work) => work(manager) } as any,
      repository,
    );
  });
  it.each(['R', 'I', 'C', 'D'])(
    'rejects new evidence in state %s',
    async (status) => {
      execution.status = status;
      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    },
  );
  it('locks the parent and derives all ownership from it', async () => {
    const saved = await service.create({ ...dto, siteId: 999 });
    expect(manager.findOne).toHaveBeenCalledWith(
      CiltSequencesExecutionsEntity,
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
    expect(saved).toMatchObject({
      siteId: 7,
      positionId: 8,
      ciltId: 9,
      ciltSequencesExecutionsId: 10,
      type: 'INITIAL',
    });
  });
  it('allows an identical upload retry after completion without writing', async () => {
    execution.status = 'R';
    const evidence = { id: 20 };
    repository.findOne.mockResolvedValue(evidence);
    await expect(service.create(dto)).resolves.toBe(evidence);
    expect(repository.save).not.toHaveBeenCalled();
  });
  it('rejects deleting completed evidence', async () => {
    execution.status = 'R';
    repository.findOne.mockResolvedValue({
      id: 20,
      ciltSequencesExecutionsId: 10,
    });
    await expect(service.delete(20)).rejects.toBeInstanceOf(ConflictException);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });
  it('rejects final evidence before execution starts', async () => {
    execution.secuenceStart = null;
    await expect(
      service.create({ ...dto, type: 'FINAL' as any }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('locks the execution before locking evidence for edits', async () => {
    repository.findOne.mockResolvedValue({
      id: 20,
      ciltSequencesExecutionsId: 10,
    });
    await service.update({ id: 20, evidenceUrl: 'https://example.com/new' });
    expect(manager.findOne.mock.calls.map((call) => call[0])).toEqual([
      CiltSequencesExecutionsEntity,
      CiltSequencesExecutionsEvidencesEntity,
    ]);
  });
});
