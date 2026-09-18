import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SiteService } from '../site/site.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { FAST_SESSION, PRIMARY_SESSION } from './models/auth-token.payload';

describe('AuthService token refresh', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
    signAsync: jest.fn(),
  } as unknown as JwtService;
  const usersService = {
    findByIdWithSites: jest.fn(),
    findById: jest.fn(),
    getUserRoles: jest.fn(),
    updateLastLogin: jest.fn(),
    findOneByPhoneNumber: jest.fn(),
    sendFastPasswordWhatsApp: jest.fn(),
  } as unknown as UsersService;
  const siteService = {
    getCompanyName: jest.fn(),
  } as unknown as SiteService;
  const service = new AuthService(jwtService, usersService, siteService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects refreshing another user token', async () => {
    jest.mocked(jwtService.verifyAsync).mockResolvedValue({
      id: 22,
      email: 'other@example.com',
      sessionType: PRIMARY_SESSION,
    });

    await expect(
      service.refreshToken({ token: 'other-user-token' }, 10),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersService.findByIdWithSites).not.toHaveBeenCalled();
  });

  it('rejects invalid and expired tokens instead of decoding them', async () => {
    jest
      .mocked(jwtService.verifyAsync)
      .mockRejectedValue(
        Object.assign(new Error('expired'), { name: 'TokenExpiredError' }),
      );

    await expect(
      service.refreshToken({ token: 'expired-token' }, 10),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('does not refresh a temporary fast-password session', async () => {
    jest.mocked(jwtService.verifyAsync).mockResolvedValue({
      id: 10,
      email: 'effective@example.com',
      sessionType: FAST_SESSION,
      actorId: 5,
    });

    await expect(
      service.refreshToken({ token: 'fast-session-token' }, 10),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersService.findByIdWithSites).not.toHaveBeenCalled();
  });

  it('refreshes only the authenticated primary user', async () => {
    jest.mocked(jwtService.verifyAsync).mockResolvedValue({
      id: 10,
      email: 'user@example.com',
      platform: 'ANDROID',
      timezone: 'America/Mexico_City',
      sessionType: PRIMARY_SESSION,
    });
    jest.mocked(usersService.findByIdWithSites).mockResolvedValue({
      id: 10,
      name: 'User',
      email: 'user@example.com',
      status: 'A',
      userHasSites: [
        {
          site: {
            id: 1,
            name: 'Site',
            logo: 'logo.png',
            companyId: 2,
            dueDate: new Date(Date.now() + 86_400_000).toISOString(),
          },
        },
      ],
    } as any);
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['operator']);
    jest.mocked(siteService.getCompanyName).mockResolvedValue('Company');
    jest.mocked(jwtService.signAsync).mockResolvedValue('new-token');

    const response = await service.refreshToken({ token: 'valid-token' }, 10);

    expect(usersService.findByIdWithSites).toHaveBeenCalledWith(10);
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 10,
        sessionType: PRIMARY_SESSION,
      }),
    );
    expect(response.token).toBe('new-token');
  });

  it('updates last login only for the authenticated user', async () => {
    const user = {
      id: 7,
      email: 'authenticated@example.com',
    } as any;
    jest.mocked(usersService.findById).mockResolvedValue(user);
    jest.mocked(usersService.updateLastLogin).mockResolvedValue({} as any);

    const response = await service.updateLastLogin(
      {
        userId: 999,
        date: new Date('2026-09-18T10:00:00.000Z'),
        platform: 'ANDROID',
        timezone: 'America/Mexico_City',
      },
      7,
    );

    expect(usersService.findById).toHaveBeenCalledWith(7);
    expect(usersService.findById).not.toHaveBeenCalledWith(999);
    expect(usersService.updateLastLogin).toHaveBeenCalledWith(user);
    expect(response).toEqual({
      userId: 7,
      platform: 'ANDROID',
      lastLoginDate: new Date('2026-09-18T10:00:00.000Z'),
    });
  });

  it('does not reveal whether a phone number belongs to a user', async () => {
    jest.mocked(usersService.findOneByPhoneNumber).mockResolvedValue(null);

    const response = await service.sendFastPasswordByPhone({
      phoneNumber: '521234567890',
    });

    expect(response).toEqual({
      message: 'If the account exists, the fast password will be sent',
    });
    expect(usersService.sendFastPasswordWhatsApp).not.toHaveBeenCalled();
  });

  it('sends a fast password without returning the phone or secret', async () => {
    jest.mocked(usersService.findOneByPhoneNumber).mockResolvedValue({
      phoneNumber: '521234567890',
      fastPassword: 'AB12',
      translation: 'ES',
      status: 'A',
    } as any);
    jest.mocked(usersService.sendFastPasswordWhatsApp).mockResolvedValue();

    const response = await service.sendFastPasswordByPhone({
      phoneNumber: '521234567890',
    });

    expect(usersService.sendFastPasswordWhatsApp).toHaveBeenCalledWith(
      '521234567890',
      'AB12',
      'ES',
    );
    expect(response).toEqual({
      message: 'If the account exists, the fast password will be sent',
    });
  });
});
