import { DataSource, EntityManager } from 'typeorm';
import { ValidationException } from 'src/common/exceptions/types/validation.exception';
import { CardNoteEntity } from '../cardNotes/card.notes.entity';
import { EvidenceEntity } from '../evidence/entities/evidence.entity';
import { CardSolutionPersistence } from './card-solution.persistence';
import { CardEntity } from './entities/card.entity';

describe('CardSolutionPersistence', () => {
  const manager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
  } as unknown as DataSource;
  const persistence = new CardSolutionPersistence(dataSource);

  const card = {
    id: 12,
    siteId: 2,
    status: 'A',
    userDefinitiveSolutionId: null,
    userProvisionalSolutionId: null,
    evidenceImcr: 0,
    evidenceVips: 0,
  } as CardEntity;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(manager.findOne).mockResolvedValue({ ...card });
    jest.mocked(manager.create).mockImplementation((_entity, value) => value);
    jest.mocked(manager.save).mockImplementation((_entity, value) =>
      Promise.resolve(value),
    );
  });

  it('persists a definitive solution, evidences and audit note atomically', async () => {
    const result = await persistence.persist({
      cardId: 12,
      type: 'definitive',
      solutionUser: { id: 8, name: 'Resolver' },
      actor: { id: 7, name: 'Fast Password User' },
      comments: 'Resolved',
      evidences: [{ type: 'IMCR', url: 'evidence.jpg' }],
    });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.findOne).toHaveBeenCalledWith(CardEntity, {
      where: { id: 12 },
      lock: { mode: 'pessimistic_write' },
    });
    expect(result).toEqual(
      expect.objectContaining({
        status: 'R',
        userDefinitiveSolutionId: 8,
        userAppDefinitiveSolutionId: 7,
        evidenceImcr: 1,
      }),
    );
    expect(manager.save).toHaveBeenCalledWith(
      EvidenceEntity,
      expect.arrayContaining([
        expect.objectContaining({
          cardId: 12,
          siteId: 2,
          evidenceType: 'IMCR',
        }),
      ]),
    );
    expect(manager.save).toHaveBeenCalledWith(
      CardNoteEntity,
      expect.objectContaining({
        cardId: 12,
        note: expect.stringContaining('<7 Fast Password User>'),
      }),
    );
  });

  it('persists provisional solution fields using the same transaction', async () => {
    const result = await persistence.persist({
      cardId: 12,
      type: 'provisional',
      solutionUser: { id: 8, name: 'Resolver' },
      actor: { id: 7, name: 'Operator' },
      comments: 'Temporary action',
      evidences: [{ type: 'VIPS', url: 'temporary.mp4' }],
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: 'P',
        userProvisionalSolutionId: 8,
        userAppProvisionalSolutionId: 7,
        evidenceVips: 1,
      }),
    );
  });

  it('rejects a concurrent attempt to overwrite an existing solution', async () => {
    jest.mocked(manager.findOne).mockResolvedValue({
      ...card,
      userDefinitiveSolutionId: 9,
    });

    await expect(
      persistence.persist({
        cardId: 12,
        type: 'definitive',
        solutionUser: { id: 8, name: 'Resolver' },
        actor: { id: 7, name: 'Operator' },
        comments: 'Resolved',
        evidences: [],
      }),
    ).rejects.toBeInstanceOf(ValidationException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('propagates an evidence failure so the whole transaction rolls back', async () => {
    jest
      .mocked(manager.save)
      .mockResolvedValueOnce({ ...card, status: 'R' })
      .mockRejectedValueOnce(new Error('evidence insert failed'));

    await expect(
      persistence.persist({
        cardId: 12,
        type: 'definitive',
        solutionUser: { id: 8, name: 'Resolver' },
        actor: { id: 7, name: 'Operator' },
        comments: 'Resolved',
        evidences: [{ type: 'IMCR', url: 'evidence.jpg' }],
      }),
    ).rejects.toThrow('evidence insert failed');
    expect(manager.save).not.toHaveBeenCalledWith(
      CardNoteEntity,
      expect.anything(),
    );
  });
});
