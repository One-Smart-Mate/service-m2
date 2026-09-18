import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import {
  SITE_RESOURCE_ACCESS_KEY,
  SiteResourceAccessMetadata,
} from 'src/common/decorators/site-resource-access.decorator';
import { CardTypesEntity } from 'src/modules/cardTypes/entities/cardTypes.entity';
import { CardEntity } from 'src/modules/card/entities/card.entity';
import { Chart } from 'src/modules/charts/entities/chart.entity';
import { LevelEntity } from 'src/modules/level/entities/level.entity';
import { UsersService } from 'src/modules/users/users.service';
import { DataSource, Repository } from 'typeorm';
import {
  REQUIRE_SITE_ACCESS_KEY,
  SiteAccessGuard,
  SKIP_SITE_ACCESS_KEY,
} from './site-access.guard';

describe('SiteAccessGuard', () => {
  const metadata = {
    isPublic: false,
    skipSiteAccess: false,
    requireSiteAccess: false,
    siteResourceAccess: undefined as SiteResourceAccessMetadata | undefined,
  };
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === IS_PUBLIC_KEY) return metadata.isPublic;
      if (key === SKIP_SITE_ACCESS_KEY) return metadata.skipSiteAccess;
      if (key === REQUIRE_SITE_ACCESS_KEY) return metadata.requireSiteAccess;
      if (key === SITE_RESOURCE_ACCESS_KEY) return metadata.siteResourceAccess;
      return undefined;
    }),
  } as unknown as Reflector;
  const usersService = {
    getUserRoles: jest.fn(),
    findByIdWithSites: jest.fn(),
  } as unknown as UsersService;
  const cardRepository = {
    findOne: jest.fn(),
  } as unknown as Repository<CardEntity>;
  const chartRepository = {
    findOne: jest.fn(),
  } as unknown as Repository<Chart>;
  const cardTypeRepository = {
    findOne: jest.fn(),
  } as unknown as Repository<CardTypesEntity>;
  const levelRepository = {
    findOne: jest.fn(),
  } as unknown as Repository<LevelEntity>;
  const dataSource = {
    getRepository: jest.fn((entity) => {
      if (entity === CardEntity) return cardRepository;
      if (entity === CardTypesEntity) return cardTypeRepository;
      if (entity === LevelEntity) return levelRepository;
      return chartRepository;
    }),
  } as unknown as DataSource;
  const guard = new SiteAccessGuard(reflector, usersService, dataSource);

  const createContext = (request: Record<string, unknown>) =>
    ({
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    metadata.isPublic = false;
    metadata.skipSiteAccess = false;
    metadata.requireSiteAccess = false;
    metadata.siteResourceAccess = undefined;
    jest.clearAllMocks();
  });

  it('does not apply tenant filtering to public routes', async () => {
    metadata.isPublic = true;

    await expect(guard.canActivate(createContext({}))).resolves.toBe(true);
    expect(usersService.getUserRoles).not.toHaveBeenCalled();
  });

  it('respects the explicit site access bypass decorator', async () => {
    metadata.skipSiteAccess = true;

    await expect(guard.canActivate(createContext({}))).resolves.toBe(true);
    expect(usersService.getUserRoles).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated private request', async () => {
    await expect(guard.canActivate(createContext({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('allows a non-site endpoint for an authenticated user', async () => {
    const context = createContext({ user: { id: 10 } });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(usersService.getUserRoles).not.toHaveBeenCalled();
  });

  it('requires siteId on endpoints marked as site scoped', async () => {
    metadata.requireSiteAccess = true;
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['local_admin']);
    const context = createContext({ user: { id: 10 } });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it.each(['invalid', '0', '-1', '1.5'])(
    'rejects an invalid siteId: %s',
    async (siteId) => {
      const context = createContext({
        user: { id: 10 },
        params: { siteId },
      });

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(usersService.getUserRoles).not.toHaveBeenCalled();
    },
  );

  it('validates every siteId found in params, query, and nested body data', async () => {
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['local_admin']);
    jest.mocked(usersService.findByIdWithSites).mockResolvedValue({
      userHasSites: [{ site: { id: 2 } }, { site: { id: 3 } }],
    } as never);
    const context = createContext({
      user: { id: 10 },
      params: { siteId: '2' },
      query: { site_id: '3' },
      body: { filters: { siteIds: [2, 3] } },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(usersService.getUserRoles).toHaveBeenCalledWith(10);
    expect(usersService.findByIdWithSites).toHaveBeenCalledWith(10);
  });

  it('rejects access when any requested site is outside the user sites', async () => {
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['local_admin']);
    jest.mocked(usersService.findByIdWithSites).mockResolvedValue({
      userHasSites: [{ site: { id: 2 } }],
    } as never);
    const context = createContext({
      user: { id: 10 },
      body: { siteIds: [2, 3] },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('grants global site access only to the IH_sis_admin role', async () => {
    jest
      .mocked(usersService.getUserRoles)
      .mockResolvedValue(['mechanic', 'IH_sis_admin']);
    const context = createContext({
      user: { id: 10 },
      params: { siteId: '999' },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(usersService.findByIdWithSites).not.toHaveBeenCalled();
  });

  it('allows IH_sis_admin to omit siteId on globally queryable endpoints', async () => {
    metadata.requireSiteAccess = true;
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['IH_sis_admin']);
    const context = createContext({ user: { id: 10 } });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(usersService.findByIdWithSites).not.toHaveBeenCalled();
  });

  it('resolves the card site from a cardId before authorizing access', async () => {
    metadata.siteResourceAccess = {
      resource: 'card',
      lookup: 'id',
      source: 'params',
      requestKey: 'cardId',
    };
    jest
      .mocked(cardRepository.findOne)
      .mockResolvedValue({ siteId: 2 } as CardEntity);
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['mechanic']);
    jest.mocked(usersService.findByIdWithSites).mockResolvedValue({
      userHasSites: [{ site: { id: 2 } }],
    } as never);
    const context = createContext({
      user: { id: 10 },
      params: { cardId: '45' },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(cardRepository.findOne).toHaveBeenCalledWith({
      select: { siteId: true },
      where: { id: 45 },
    });
  });

  it('resolves a card site from its UUID', async () => {
    metadata.siteResourceAccess = {
      resource: 'card',
      lookup: 'uuid',
      source: 'params',
      requestKey: 'cardUUID',
    };
    jest
      .mocked(cardRepository.findOne)
      .mockResolvedValue({ siteId: 2 } as CardEntity);
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['IH_sis_admin']);
    const context = createContext({
      user: { id: 10 },
      params: { cardUUID: 'card-uuid' },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(cardRepository.findOne).toHaveBeenCalledWith({
      select: { siteId: true },
      where: { cardUUID: 'card-uuid' },
    });
  });

  it('rejects a resource from a site not assigned to the user', async () => {
    metadata.siteResourceAccess = {
      resource: 'chart',
      lookup: 'id',
      source: 'params',
      requestKey: 'chartId',
    };
    jest
      .mocked(chartRepository.findOne)
      .mockResolvedValue({ siteId: 3 } as Chart);
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['local_admin']);
    jest.mocked(usersService.findByIdWithSites).mockResolvedValue({
      userHasSites: [{ site: { id: 2 } }],
    } as never);
    const context = createContext({
      user: { id: 10 },
      params: { chartId: '7' },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('resolves the tenant of a site-owned catalog record', async () => {
    metadata.siteResourceAccess = {
      resource: 'cardType',
      lookup: 'id',
      source: 'body',
      requestKey: 'id',
    };
    jest
      .mocked(cardTypeRepository.findOne)
      .mockResolvedValue({ siteId: 2 } as CardTypesEntity);
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['local_admin']);
    jest.mocked(usersService.findByIdWithSites).mockResolvedValue({
      userHasSites: [{ site: { id: 2 } }],
    } as never);
    const context = createContext({
      user: { id: 10 },
      body: { id: 8 },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(cardTypeRepository.findOne).toHaveBeenCalledWith({
      select: { siteId: true },
      where: { id: 8 },
    });
  });

  it('validates every resource relationship declared by a handler', async () => {
    metadata.siteResourceAccess = [
      {
        resource: 'cardType',
        lookup: 'id',
        source: 'body',
        requestKey: 'cardTypeId',
      },
      {
        resource: 'level',
        lookup: 'id',
        source: 'body',
        requestKey: 'levelId',
      },
    ];
    jest
      .mocked(cardTypeRepository.findOne)
      .mockResolvedValue({ siteId: 2 } as CardTypesEntity);
    jest
      .mocked(levelRepository.findOne)
      .mockResolvedValue({ siteId: 3 } as LevelEntity);
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['local_admin']);
    jest.mocked(usersService.findByIdWithSites).mockResolvedValue({
      userHasSites: [{ site: { id: 2 } }],
    } as never);
    const context = createContext({
      user: { id: 10 },
      body: { cardTypeId: 8, levelId: 9 },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('skips an omitted optional resource relationship', async () => {
    metadata.siteResourceAccess = [
      {
        resource: 'cardType',
        lookup: 'id',
        source: 'body',
        requestKey: 'cardTypeId',
      },
      {
        resource: 'level',
        lookup: 'id',
        source: 'body',
        requestKey: 'levelId',
        required: false,
      },
    ];
    jest
      .mocked(cardTypeRepository.findOne)
      .mockResolvedValue({ siteId: 2 } as CardTypesEntity);
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['local_admin']);
    jest.mocked(usersService.findByIdWithSites).mockResolvedValue({
      userHasSites: [{ site: { id: 2 } }],
    } as never);
    const context = createContext({
      user: { id: 10 },
      body: { cardTypeId: 8 },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(levelRepository.findOne).not.toHaveBeenCalled();
  });

  it('returns not found when the protected resource does not exist', async () => {
    metadata.siteResourceAccess = {
      resource: 'card',
      lookup: 'id',
      source: 'body',
      requestKey: 'cardId',
    };
    jest.mocked(cardRepository.findOne).mockResolvedValue(null);
    const context = createContext({
      user: { id: 10 },
      body: { cardId: 999 },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(usersService.getUserRoles).not.toHaveBeenCalled();
  });
});
