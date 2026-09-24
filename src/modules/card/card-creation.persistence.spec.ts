import { DataSource, EntityManager, Repository } from 'typeorm';
import { ValidationException } from 'src/common/exceptions/types/validation.exception';
import { EvidenceEntity } from '../evidence/entities/evidence.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { CardCreationPersistence } from './card-creation.persistence';
import { CardEntity } from './entities/card.entity';

describe('CardCreationPersistence', () => {
  const manager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  } as unknown as EntityManager;
  const cardRepository = {
    findOneBy: jest.fn(),
  } as unknown as Repository<CardEntity>;
  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
    getRepository: jest.fn(() => cardRepository),
  } as unknown as DataSource;
  const persistence = new CardCreationPersistence(dataSource);

  const input = {
    card: {
      siteId: 2,
      creatorId: 7,
      cardUUID: 'offline-uuid',
      evidenceImcr: 1,
    },
    siteId: 2,
    creatorId: 7,
    cardUUID: 'offline-uuid',
    createdAt: new Date('2026-09-23T12:00:00.000Z'),
    evidences: [{ type: 'IMCR', url: 'https://example.com/evidence.jpg' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(manager.create).mockImplementation((_entity, value) => value);
  });

  it('locks the site and saves the card and evidences in one transaction', async () => {
    jest
      .mocked(manager.findOne)
      .mockResolvedValueOnce({ id: 2 } as SiteEntity)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ siteCardId: 14 } as CardEntity);
    jest
      .mocked(manager.save)
      .mockResolvedValueOnce({ ...input.card, id: 91, siteCardId: 15 })
      .mockResolvedValueOnce([]);

    await expect(persistence.persist(input)).resolves.toEqual({
      card: { ...input.card, id: 91, siteCardId: 15 },
      created: true,
    });

    expect(manager.findOne).toHaveBeenNthCalledWith(1, SiteEntity, {
      where: { id: 2 },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.save).toHaveBeenNthCalledWith(
      1,
      CardEntity,
      expect.objectContaining({ siteCardId: 15 }),
    );
    expect(manager.save).toHaveBeenNthCalledWith(
      2,
      EvidenceEntity,
      expect.arrayContaining([
        expect.objectContaining({
          cardId: 91,
          siteId: 2,
          evidenceType: 'IMCR',
        }),
      ]),
    );
  });

  it('treats the same client UUID as an idempotent retry', async () => {
    const existingCard = {
      id: 91,
      siteId: 2,
      creatorId: 7,
      cardUUID: 'offline-uuid',
    } as CardEntity;
    jest
      .mocked(manager.findOne)
      .mockResolvedValueOnce({ id: 2 } as SiteEntity)
      .mockResolvedValueOnce(existingCard);

    await expect(persistence.persist(input)).resolves.toEqual({
      card: existingCard,
      created: false,
    });
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('rejects a UUID collision from another creator', async () => {
    jest
      .mocked(manager.findOne)
      .mockResolvedValueOnce({ id: 2 } as SiteEntity)
      .mockResolvedValueOnce({
        id: 91,
        siteId: 2,
        creatorId: 8,
        cardUUID: 'offline-uuid',
      } as CardEntity);

    await expect(persistence.persist(input)).rejects.toBeInstanceOf(
      ValidationException,
    );
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('propagates an evidence failure so the transaction can roll back', async () => {
    jest
      .mocked(manager.findOne)
      .mockResolvedValueOnce({ id: 2 } as SiteEntity)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    jest
      .mocked(manager.save)
      .mockResolvedValueOnce({ ...input.card, id: 91, siteCardId: 1 })
      .mockRejectedValueOnce(new Error('evidence insert failed'));

    await expect(persistence.persist(input)).rejects.toThrow(
      'evidence insert failed',
    );
  });

  it('resolves a concurrent UUID insert as an idempotent retry', async () => {
    const existingCard = {
      id: 91,
      siteId: 2,
      creatorId: 7,
      cardUUID: 'offline-uuid',
    } as CardEntity;
    jest
      .mocked(dataSource.transaction)
      .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
    jest.mocked(cardRepository.findOneBy).mockResolvedValue(existingCard);

    await expect(persistence.persist(input)).resolves.toEqual({
      card: existingCard,
      created: false,
    });
  });
});
