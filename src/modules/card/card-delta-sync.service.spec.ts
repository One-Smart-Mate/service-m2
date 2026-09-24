import { UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CardDeltaSyncReader } from './card-delta-sync.reader';
import { CardService } from './card.service';

describe('CardService delta synchronization scope', () => {
  const usersService = {
    getAccessibleSiteIds: jest.fn(),
  } as unknown as UsersService;
  const deltaReader = {
    read: jest.fn(),
  } as unknown as CardDeltaSyncReader;
  const service = Reflect.construct(CardService, [
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    usersService,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    deltaReader,
  ]) as CardService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(deltaReader.read).mockResolvedValue({ changes: [] } as never);
  });

  it('reads changes only when the effective user can access the site', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue([25]);

    await service.syncCardChanges(25, 7, 'opaque-cursor', 50);

    expect(usersService.getAccessibleSiteIds).toHaveBeenCalledWith(7);
    expect(deltaReader.read).toHaveBeenCalledWith(
      25,
      'opaque-cursor',
      50,
    );
  });

  it('rejects another tenant site before reading any data', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue([30]);

    await expect(service.syncCardChanges(25, 7)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(deltaReader.read).not.toHaveBeenCalled();
  });

  it('preserves global site access for IH_sis_admin', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue(null);

    await service.syncCardChanges(25, 1);

    expect(deltaReader.read).toHaveBeenCalledWith(25, undefined, undefined);
  });
});
