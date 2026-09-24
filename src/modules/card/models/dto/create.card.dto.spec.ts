import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCardDTO } from './create.card.dto';

describe('CreateCardDTO', () => {
  const validRequest = {
    siteId: 2,
    cardUUID: 'fa080ad5-1937-48ce-b3e7-f4c9ec974215',
    cardCreationDate: '2026-09-23T12:00:00.000Z',
    nodeId: 10,
    priorityId: 20,
    cardTypeValue: 'unsafe',
    cardTypeId: 30,
    preclassifierId: 40,
    comments: 'Offline card',
    evidences: [],
    appSo: 'android',
    appVersion: '2.0.0',
    notifyResponsible: false,
  };

  it('accepts the mobile offline creation contract', async () => {
    const errors = await validate(
      plainToInstance(CreateCardDTO, validRequest),
    );

    expect(errors).toEqual([]);
  });

  it.each(['nodeId', 'priorityId'])(
    'requires the database-backed field %s',
    async (field) => {
      const request: Record<string, unknown> = { ...validRequest };
      delete request[field];

      const errors = await validate(plainToInstance(CreateCardDTO, request));

      expect(errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ property: field })]),
      );
    },
  );

  it('rejects values that exceed database column limits', async () => {
    const errors = await validate(
      plainToInstance(CreateCardDTO, {
        ...validRequest,
        cardUUID: 'u'.repeat(61),
        comments: 'c'.repeat(201),
        evidences: [{ type: 'IMCR', url: 'x'.repeat(501) }],
      }),
    );

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['cardUUID', 'comments', 'evidences']),
    );
  });

  it('limits evidence count for a single offline card', async () => {
    const errors = await validate(
      plainToInstance(CreateCardDTO, {
        ...validRequest,
        evidences: Array.from({ length: 21 }, (_, index) => ({
          type: 'IMCR',
          url: `https://example.com/${index}.jpg`,
        })),
      }),
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'evidences' }),
      ]),
    );
  });
});
