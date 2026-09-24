import {
  SITE_RESOURCE_ACCESS_KEY,
  SiteResourceAccessOptions,
} from 'src/common/decorators/site-resource-access.decorator';
import { ChartsController } from '../charts/charts.controller';
import { CardController } from './card.controller';

describe('Resource site authorization metadata', () => {
  it('does not expose fast passwords through a card URL', () => {
    expect(CardController.prototype).not.toHaveProperty(
      'findCardsByFastPassword',
    );
  });

  const cardRoutes: Array<{
    method: keyof CardController;
    options: SiteResourceAccessOptions;
  }> = [
    {
      method: 'findByCardUUID',
      options: {
        resource: 'card',
        lookup: 'uuid',
        source: 'params',
        requestKey: 'uuid',
      },
    },
    {
      method: 'findByIDAndGetEvidences',
      options: {
        resource: 'card',
        lookup: 'id',
        source: 'params',
        requestKey: 'cardId',
      },
    },
    {
      method: 'updateDefinitiveSolution',
      options: {
        resource: 'card',
        lookup: 'id',
        source: 'body',
        requestKey: 'cardId',
      },
    },
    {
      method: 'updateProvisionalSolution',
      options: {
        resource: 'card',
        lookup: 'id',
        source: 'body',
        requestKey: 'cardId',
      },
    },
    {
      method: 'findCardNotes',
      options: {
        resource: 'card',
        lookup: 'id',
        source: 'params',
        requestKey: 'cardId',
      },
    },
    {
      method: 'findCardNotesByUUID',
      options: {
        resource: 'card',
        lookup: 'uuid',
        source: 'params',
        requestKey: 'cardUUID',
      },
    },
    {
      method: 'updateCardPriority',
      options: {
        resource: 'card',
        lookup: 'id',
        source: 'body',
        requestKey: 'cardId',
      },
    },
    {
      method: 'updateCardResponsible',
      options: {
        resource: 'card',
        lookup: 'id',
        source: 'body',
        requestKey: 'cardId',
      },
    },
    {
      method: 'updateCardCustomDueDate',
      options: {
        resource: 'card',
        lookup: 'id',
        source: 'body',
        requestKey: 'cardId',
      },
    },
    {
      method: 'discardCard',
      options: {
        resource: 'card',
        lookup: 'id',
        source: 'body',
        requestKey: 'cardId',
      },
    },
  ];

  it.each(cardRoutes)(
    'protects CardController.$method',
    ({ method, options }) => {
      const handler = CardController.prototype[method];

      expect(Reflect.getMetadata(SITE_RESOURCE_ACCESS_KEY, handler)).toEqual(
        options,
      );
    },
  );

  it('protects chart levels using the chart site', () => {
    expect(
      Reflect.getMetadata(
        SITE_RESOURCE_ACCESS_KEY,
        ChartsController.prototype.findChartLevels,
      ),
    ).toEqual({
      resource: 'chart',
      lookup: 'id',
      source: 'params',
      requestKey: 'chartId',
    });
  });
});

describe('CardController create identity', () => {
  it('uses the effective authenticated user instead of a client creatorId', async () => {
    const cardService = {
      createOptimized: jest.fn().mockResolvedValue({ id: 1 }),
    };
    const controller = new CardController(cardService as never);

    await controller.create(
      {
        siteId: 2,
        creatorId: 999,
      } as never,
      { user: { id: 7, actorId: 3 } },
    );

    expect(cardService.createOptimized).toHaveBeenCalledWith({
      siteId: 2,
      creatorId: 7,
    });
  });

  it('uses the effective Fast Password user for an offline batch', async () => {
    const cardService = {
      syncOfflineCards: jest.fn().mockResolvedValue({ results: [] }),
    };
    const controller = new CardController(cardService as never);
    const cards = [{ siteId: 2, creatorId: 999 }];

    await controller.syncOfflineCards(
      { cards } as never,
      { user: { id: 7, actorId: 3 } },
    );

    expect(cardService.syncOfflineCards).toHaveBeenCalledWith(cards, 7);
  });
});

describe('CardController mutation identity', () => {
  const effectiveSession = { user: { id: 7, actorId: 3 } };

  it.each([
    {
      controllerMethod: 'updateDefinitiveSolution' as const,
      serviceMethod: 'updateDefinitivesolution',
      dto: {
        cardId: 1,
        userDefinitiveSolutionId: 8,
        userAppDefinitiveSolutionId: 999,
        comments: 'done',
        evidences: [],
      },
    },
    {
      controllerMethod: 'updateProvisionalSolution' as const,
      serviceMethod: 'updateProvisionalSolution',
      dto: {
        cardId: 1,
        userProvisionalSolutionId: 8,
        userAppProvisionalSolutionId: 999,
        comments: 'temporary',
        evidences: [],
      },
    },
    {
      controllerMethod: 'updateCardPriority' as const,
      serviceMethod: 'updateCardPriority',
      dto: { cardId: 1, priorityId: 2, idOfUpdatedBy: 999 },
    },
    {
      controllerMethod: 'updateCardResponsible' as const,
      serviceMethod: 'updateCardMechanic',
      dto: { cardId: 1, mechanicId: 8, idOfUpdatedBy: 999 },
    },
    {
      controllerMethod: 'updateCardCustomDueDate' as const,
      serviceMethod: 'updateCardCustomDueDate',
      dto: {
        cardId: 1,
        customDueDate: '2026-09-23',
        idOfUpdatedBy: 999,
      },
    },
    {
      controllerMethod: 'discardCard' as const,
      serviceMethod: 'discardCard',
      dto: {
        cardId: 1,
        amDiscardReasonId: 2,
        managerId: 999,
        managerName: 'Spoofed user',
      },
    },
  ])(
    '$controllerMethod uses the effective Fast Password user as actor',
    async ({ controllerMethod, serviceMethod, dto }) => {
      const serviceCall = jest.fn().mockResolvedValue({ id: 1 });
      const cardService = { [serviceMethod]: serviceCall };
      const controller = new CardController(cardService as never);

      await (controller[controllerMethod] as CallableFunction)(
        dto,
        effectiveSession,
      );

      expect(serviceCall).toHaveBeenCalledWith(dto, 7);
    },
  );
});

describe('CardController list identity', () => {
  it('uses the effective authenticated user for the my cards filter', async () => {
    const cardService = {
      findSiteCardsPaginated: jest.fn().mockResolvedValue({ cards: [] }),
    };
    const controller = new CardController(cardService as never);

    await controller.findBySiteIdPaginated(
      2,
      { user: { id: 7, actorId: 3 } },
      1,
      20,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      999,
      'true',
    );

    expect(cardService.findSiteCardsPaginated).toHaveBeenCalledWith(
      2,
      7,
      1,
      20,
      expect.objectContaining({ myCards: true }),
    );
  });

  it('preserves malformed pagination so the service can reject it', async () => {
    const cardService = {
      findSiteCardsPaginated: jest.fn().mockResolvedValue({ cards: [] }),
    };
    const controller = new CardController(cardService as never);

    await controller.findBySiteIdPaginated(
      2,
      { user: { id: 7, actorId: 3 } },
      '1abc',
      '50',
    );

    expect(cardService.findSiteCardsPaginated).toHaveBeenCalledWith(
      2,
      7,
      Number.NaN,
      50,
      expect.any(Object),
    );
  });
});
