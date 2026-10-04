import {
  SITE_RESOURCE_ACCESS_KEY,
} from 'src/common/decorators/site-resource-access.decorator';
import { CatalogController } from './catalog.controller';

describe('CatalogController offline snapshot', () => {
  it('protects the snapshot using the requested site', () => {
    expect(
      Reflect.getMetadata(
        SITE_RESOURCE_ACCESS_KEY,
        CatalogController.prototype.getOfflineSnapshot,
      ),
    ).toEqual({
      resource: 'site',
      lookup: 'id',
      source: 'params',
      requestKey: 'siteId',
    });
  });

  it('uses the effective Fast Password user', async () => {
    const catalogService = {
      getOfflineSnapshot: jest.fn().mockResolvedValue({ schemaVersion: 1 }),
    };
    const controller = new CatalogController(catalogService as never);

    await controller.getOfflineSnapshot(25, {
      user: { id: 7, actorId: 3 },
    });

    expect(catalogService.getOfflineSnapshot).toHaveBeenCalledWith(25, 7);
  });
});
