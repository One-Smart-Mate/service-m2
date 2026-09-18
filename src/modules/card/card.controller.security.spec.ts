import {
  SITE_RESOURCE_ACCESS_KEY,
  SiteResourceAccessOptions,
} from 'src/common/decorators/site-resource-access.decorator';
import { ChartsController } from '../charts/charts.controller';
import { CardController } from './card.controller';

describe('Resource site authorization metadata', () => {
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
