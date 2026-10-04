import { DataSource, EntityManager } from 'typeorm';
import { CardNoteEntity } from '../cardNotes/card.notes.entity';
import { CardMutationPersistence } from './card-mutation.persistence';
import { CardEntity } from './entities/card.entity';

describe('CardMutationPersistence', () => {
  const manager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
  } as unknown as DataSource;
  const persistence = new CardMutationPersistence(dataSource);

  const card = {
    id: 12,
    siteId: 2,
    siteCardId: 25,
    priorityId: 4,
    priorityCode: 'P1',
    priorityDescription: 'Urgent',
    mechanicId: null,
    mechanicName: null,
    status: 'A',
  } as CardEntity;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(manager.findOne).mockResolvedValue({ ...card });
    jest.mocked(manager.create).mockImplementation((_entity, value) => value);
    jest.mocked(manager.save).mockImplementation((_entity, value) =>
      Promise.resolve(value),
    );
  });

  it('locks and saves priority plus its audit note in one transaction', async () => {
    const dueDate = new Date(2026, 9, 1);
    const result = await persistence.updatePriority({
      cardId: 12,
      actor: { id: 7, name: 'Operator' },
      priority: {
        id: 5,
        priorityCode: 'P2',
        priorityDescription: 'Normal',
      },
      dueDate,
    });

    expect(manager.findOne).toHaveBeenCalledWith(CardEntity, {
      where: { id: 12 },
      lock: { mode: 'pessimistic_write' },
    });
    expect(result).toEqual(
      expect.objectContaining({
        changed: true,
        card: expect.objectContaining({
          priorityId: 5,
          cardDueDate: dueDate,
        }),
      }),
    );
    expect(manager.save).toHaveBeenCalledWith(
      CardNoteEntity,
      expect.objectContaining({ note: expect.stringContaining('<7 Operator>') }),
    );
  });

  it('does not write or notify when the mechanic is already assigned', async () => {
    jest.mocked(manager.findOne).mockResolvedValue({
      ...card,
      mechanicId: 8,
      mechanicName: 'Mechanic',
    });

    await expect(
      persistence.updateMechanic({
        cardId: 12,
        actor: { id: 7, name: 'Operator' },
        mechanic: { id: 8, name: 'Mechanic' },
      }),
    ).resolves.toEqual(
      expect.objectContaining({ changed: false }),
    );
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('propagates an audit failure so the card update rolls back', async () => {
    jest
      .mocked(manager.save)
      .mockResolvedValueOnce({ ...card, mechanicId: 8 })
      .mockRejectedValueOnce(new Error('audit insert failed'));

    await expect(
      persistence.updateMechanic({
        cardId: 12,
        actor: { id: 7, name: 'Operator' },
        mechanic: { id: 8, name: 'Mechanic' },
      }),
    ).rejects.toThrow('audit insert failed');
  });

  it('uses the server transaction time when discarding a card', async () => {
    const result = await persistence.discard({
      cardId: 12,
      actor: { id: 7, name: 'Manager' },
      discardReasonId: 3,
      discardReason: 'Duplicate',
      comments: 'Reviewed',
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: 'D',
        managerId: 7,
        managerName: 'Manager',
        cardManagerCloseDate: expect.any(String),
      }),
    );
  });
});
