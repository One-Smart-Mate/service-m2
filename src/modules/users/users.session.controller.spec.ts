import { ForbiddenException } from '@nestjs/common';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import {
  FAST_SESSION,
  PRIMARY_SESSION,
} from '../auth/models/auth-token.payload';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController session mutations', () => {
  const usersService = {
    logout: jest.fn(),
  } as unknown as UsersService;
  const controller = new UsersController(usersService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication for logout', () => {
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, UsersController.prototype.logout),
    ).not.toBe(true);
  });

  it('logs out the authenticated user instead of a body-supplied user', async () => {
    jest.mocked(usersService.logout).mockResolvedValue({ id: 7 } as any);

    await controller.logout(
      { userId: 999, osName: 'ANDROID' },
      {
        user: {
          id: 7,
          jti: 'primary-session-id',
          sessionType: PRIMARY_SESSION,
        },
      },
    );

    expect(usersService.logout).toHaveBeenCalledWith(
      7,
      'ANDROID',
      'primary-session-id',
    );
  });

  it('does not let a fast session close the primary session', () => {
    expect(() =>
      controller.logout(
        { userId: 9, osName: 'IOS' },
        { user: { id: 9, actorId: 7, sessionType: FAST_SESSION } },
      ),
    ).toThrow(ForbiddenException);
    expect(usersService.logout).not.toHaveBeenCalled();
  });
});
