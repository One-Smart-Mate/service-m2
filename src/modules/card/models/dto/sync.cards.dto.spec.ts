import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CARD_SYNC_BATCH_MAX_SIZE,
  SyncCardsDTO,
} from './sync.cards.dto';

describe('SyncCardsDTO', () => {
  const card = (cardUUID: string) => ({
    siteId: 2,
    cardUUID,
    cardCreationDate: '2026-09-23T12:00:00.000Z',
    nodeId: 10,
    priorityId: 20,
    cardTypeValue: 'unsafe',
    cardTypeId: 30,
    preclassifierId: 40,
    comments: 'Offline card',
    evidences: [],
    notifyResponsible: false,
  });

  it('accepts a bounded batch with unique client UUIDs', async () => {
    const errors = await validate(
      plainToInstance(SyncCardsDTO, {
        cards: [card('offline-1'), card('offline-2')],
      }),
    );

    expect(errors).toEqual([]);
  });

  it('rejects duplicate UUIDs in the same batch', async () => {
    const errors = await validate(
      plainToInstance(SyncCardsDTO, {
        cards: [card('offline-1'), card('offline-1')],
      }),
    );

    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'cards' })]),
    );
  });

  it('rejects a malformed item without throwing during validation', async () => {
    await expect(
      validate(plainToInstance(SyncCardsDTO, { cards: [null] })),
    ).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'cards' })]),
    );
  });

  it.each([0, CARD_SYNC_BATCH_MAX_SIZE + 1])(
    'rejects a batch containing %s cards',
    async (size) => {
      const errors = await validate(
        plainToInstance(SyncCardsDTO, {
          cards: Array.from({ length: size }, (_, index) =>
            card(`offline-${index}`),
          ),
        }),
      );

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ property: 'cards' }),
        ]),
      );
    },
  );
});
