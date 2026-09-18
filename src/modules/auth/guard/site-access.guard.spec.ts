import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { UsersService } from 'src/modules/users/users.service';
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
  };
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === IS_PUBLIC_KEY) return metadata.isPublic;
      if (key === SKIP_SITE_ACCESS_KEY) return metadata.skipSiteAccess;
      if (key === REQUIRE_SITE_ACCESS_KEY) return metadata.requireSiteAccess;
      return undefined;
    }),
  } as unknown as Reflector;
  const usersService = {
    getUserRoles: jest.fn(),
    findByIdWithSites: jest.fn(),
  } as unknown as UsersService;
  const guard = new SiteAccessGuard(reflector, usersService);

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
});
