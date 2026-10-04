import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { AuthSessionService } from 'src/modules/auth-session/auth-session.service';
import { UsersService } from 'src/modules/users/users.service';
import { PRIMARY_SESSION } from '../models/auth-token.payload';

describe('AuthGuard', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  } as unknown as JwtService;
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(false),
  } as unknown as Reflector;
  const authSessionService = {
    isSessionActive: jest.fn(),
  } as unknown as AuthSessionService;
  const usersService = {
    findById: jest.fn(),
  } as unknown as UsersService;
  const guard = new AuthGuard(
    jwtService,
    reflector,
    authSessionService,
    usersService,
  );

  const createContext = (authorization?: string) => {
    const request = { headers: { authorization } };
    const context = {
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    return { context, request };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies tokens with the centrally configured JwtService', async () => {
    const { context, request } = createContext('Bearer valid-token');
    const payload = {
      id: 7,
      jti: 'session-7',
      name: 'User',
      email: 'user@example.com',
      platform: 'ANDROID',
      sessionType: PRIMARY_SESSION,
    };
    jest.mocked(jwtService.verifyAsync).mockResolvedValue(payload);
    jest.mocked(authSessionService.isSessionActive).mockResolvedValue(true);
    jest.mocked(usersService.findById).mockResolvedValue({
      id: 7,
      status: 'A',
    } as any);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
    expect(request['user']).toEqual(payload);
  });

  it('rejects missing or invalid bearer tokens', async () => {
    await expect(
      guard.canActivate(createContext().context),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    jest.mocked(jwtService.verifyAsync).mockRejectedValue(new Error('invalid'));
    await expect(
      guard.canActivate(createContext('Bearer invalid-token').context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
