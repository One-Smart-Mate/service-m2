import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  } as unknown as JwtService;
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(false),
  } as unknown as Reflector;
  const guard = new AuthGuard(jwtService, reflector);

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
    jest.mocked(jwtService.verifyAsync).mockResolvedValue({ id: 7 });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
    expect(request['user']).toEqual({ id: 7 });
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
