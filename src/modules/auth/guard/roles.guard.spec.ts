import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SITE_ADMIN_ROLES } from 'src/common/auth/roles.constants';
import { REQUIRED_ROLES_KEY } from 'src/common/decorators/roles.decorator';
import {
  SELF_OR_ROLES_KEY,
  SelfOrRolesOptions,
} from 'src/common/decorators/self-or-roles.decorator';
import { UsersService } from 'src/modules/users/users.service';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const metadata = {
    requiredRoles: undefined as string[] | undefined,
    selfOrRoles: undefined as SelfOrRolesOptions | undefined,
  };
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === REQUIRED_ROLES_KEY) return metadata.requiredRoles;
      if (key === SELF_OR_ROLES_KEY) return metadata.selfOrRoles;
      return undefined;
    }),
  } as unknown as Reflector;
  const usersService = {
    getUserRoles: jest.fn(),
  } as unknown as UsersService;
  const guard = new RolesGuard(reflector, usersService);

  const createContext = (request: Record<string, unknown>) =>
    ({
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    metadata.requiredRoles = undefined;
    metadata.selfOrRoles = undefined;
    jest.clearAllMocks();
  });

  it('allows routes without role requirements', async () => {
    await expect(guard.canActivate(createContext({}))).resolves.toBe(true);
    expect(usersService.getUserRoles).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated request to a protected route', async () => {
    metadata.requiredRoles = ['local_admin'];

    await expect(guard.canActivate(createContext({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('allows a user with an explicitly required role', async () => {
    metadata.requiredRoles = ['local_admin'];
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['LOCAL_ADMIN']);

    await expect(
      guard.canActivate(createContext({ user: { id: 10 } })),
    ).resolves.toBe(true);
  });

  it('always allows IH_sis_admin on a role-protected route', async () => {
    metadata.requiredRoles = ['local_admin'];
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['IH_sis_admin']);

    await expect(
      guard.canActivate(createContext({ user: { id: 10 } })),
    ).resolves.toBe(true);
  });

  it('rejects an operational role from an administrative route', async () => {
    metadata.requiredRoles = [...SITE_ADMIN_ROLES];
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['mechanic']);

    await expect(
      guard.canActivate(createContext({ user: { id: 10 } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a user to access their own resource', async () => {
    metadata.selfOrRoles = {
      source: 'params',
      requestKey: 'userId',
      roles: SITE_ADMIN_ROLES,
    };
    const context = createContext({
      user: { id: 10 },
      params: { userId: '10' },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(usersService.getUserRoles).not.toHaveBeenCalled();
  });

  it('requires an allowed role to access another user resource', async () => {
    metadata.selfOrRoles = {
      source: 'body',
      requestKey: 'id',
      roles: SITE_ADMIN_ROLES,
    };
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['local_admin']);
    const context = createContext({
      user: { id: 10 },
      body: { id: 11 },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
