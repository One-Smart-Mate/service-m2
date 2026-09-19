import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';
import { MailService } from '../mail/mail.service';
import { ValidationException } from 'src/common/exceptions/types/validation.exception';
import * as bcryptjs from 'bcryptjs';
import { AuthSessionService } from '../auth-session/auth-session.service';
import { SiteService } from '../site/site.service';
import { RolesService } from '../roles/roles.service';
import { UserCreationPersistence } from './user-creation.persistence';
import { NotFoundCustomException } from 'src/common/exceptions/types/notFound.exception';

describe('UsersService', () => {
  const userRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<UserEntity>;

  const mailService = {
    sendResetPasswordCode: jest.fn(),
  } as unknown as MailService;
  const authSessionService = {
    revokeAllForUser: jest.fn(),
    revokeFastSessionsForUser: jest.fn(),
  } as unknown as AuthSessionService;
  const siteService = {
    findById: jest.fn(),
  } as unknown as SiteService;
  const roleService = {
    findRolesByIds: jest.fn(),
  } as unknown as RolesService;
  const userCreationPersistence = {
    persist: jest.fn(),
  } as unknown as UserCreationPersistence;

  const service = Reflect.construct(UsersService, [
    userRepository,
    undefined,
    siteService,
    roleService,
    mailService,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    authSessionService,
    userCreationPersistence,
  ]) as UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findOneByEmail', () => {
    it.each([undefined, null, '', '   '])(
      'rejects an invalid email filter: %p',
      (email) => {
        expect(() => service.findOneByEmail(email)).toThrow(
          BadRequestException,
        );
        expect(userRepository.findOne).not.toHaveBeenCalled();
      },
    );

    it('queries the repository when the email is valid', async () => {
      jest.mocked(userRepository.findOne).mockResolvedValue(null);

      await service.findOneByEmail('user@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        relations: { userHasSites: { site: true } },
      });
    });
  });

  describe('create', () => {
    it('rejects the request when any requested role does not exist', async () => {
      jest.mocked(siteService.findById).mockResolvedValue({
        id: 3,
        siteCode: 'SITE03',
      } as any);
      jest.mocked(roleService.findRolesByIds).mockResolvedValue([
        { id: 1, name: 'operator' },
      ] as any);

      await expect(
        service.create({
          name: 'User',
          email: 'user@example.com',
          phoneNumber: '521234567890',
          siteId: 3,
          password: 'password',
          uploadCardDataWithDataNet: 0,
          uploadCardEvidenceWithDataNet: 0,
          roles: [1, 999],
          translation: 'ES',
        }),
      ).rejects.toBeInstanceOf(NotFoundCustomException);
      expect(userCreationPersistence.persist).not.toHaveBeenCalled();
    });
  });

  describe('getUserRoles', () => {
    it('returns no roles when the JWT user no longer exists', async () => {
      jest.mocked(userRepository.findOne).mockResolvedValue(null);

      await expect(service.getUserRoles(10)).resolves.toEqual([]);
    });
  });

  describe('getAccessibleSiteIds', () => {
    it('returns null for IH_sis_admin to represent global access', async () => {
      jest.mocked(userRepository.findOne).mockResolvedValue({
        userRoles: [{ role: { name: 'IH_sis_admin' } }],
      } as UserEntity);

      await expect(service.getAccessibleSiteIds(10)).resolves.toBeNull();
    });

    it('returns all assigned sites for a regular user', async () => {
      jest
        .mocked(userRepository.findOne)
        .mockResolvedValueOnce({
          userRoles: [{ role: { name: 'local_admin' } }],
        } as UserEntity)
        .mockResolvedValueOnce({
          userHasSites: [{ site: { id: 2 } }, { site: { id: 3 } }],
        } as UserEntity);

      await expect(service.getAccessibleSiteIds(10)).resolves.toEqual([2, 3]);
    });

    it('rejects a regular user without assigned sites', async () => {
      jest
        .mocked(userRepository.findOne)
        .mockResolvedValueOnce({
          userRoles: [{ role: { name: 'mechanic' } }],
        } as UserEntity)
        .mockResolvedValueOnce({ userHasSites: [] } as UserEntity);

      await expect(service.getAccessibleSiteIds(10)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('password recovery', () => {
    it('does not reveal whether an email is registered', async () => {
      jest.mocked(userRepository.findOneBy).mockResolvedValue(null);

      await expect(
        service.sendCodeToEmail('missing@example.com'),
      ).resolves.toBeUndefined();
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(mailService.sendResetPasswordCode).not.toHaveBeenCalled();
    });

    it('creates a six-character code that expires in fifteen minutes', async () => {
      const now = Date.now();
      const user = {
        id: 7,
        email: 'user@example.com',
        name: 'User',
      } as UserEntity;
      jest.mocked(userRepository.findOneBy).mockResolvedValue(user);
      jest.mocked(userRepository.save).mockResolvedValue(user);
      jest.mocked(mailService.sendResetPasswordCode).mockResolvedValue();

      await service.sendCodeToEmail(' USER@example.com ');

      const sentCode = jest.mocked(mailService.sendResetPasswordCode).mock
        .calls[0][1];
      expect(sentCode).toMatch(/^[A-Z0-9]{6}$/);
      expect(user.resetCode).not.toBe(sentCode);
      expect(user.resetCodeExpiration.getTime()).toBeGreaterThan(now);
      expect(user.resetCodeExpiration.getTime()).toBeLessThanOrEqual(
        now + 15 * 60_000 + 1_000,
      );
    });

    it('rejects an expired code when changing the password', async () => {
      const resetCode = 'ABC123';
      jest.mocked(userRepository.findOne).mockResolvedValue({
        email: 'user@example.com',
        resetCode: await bcryptjs.hash(resetCode, 4),
        resetCodeExpiration: new Date(Date.now() - 1),
      } as UserEntity);

      await expect(
        service.resetPassword({
          email: 'user@example.com',
          newPassword: 'new-password',
          resetCode,
        }),
      ).rejects.toBeInstanceOf(ValidationException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('consumes a valid code after changing the password', async () => {
      const resetCode = 'ABC123';
      const user = {
        id: 7,
        email: 'user@example.com',
        resetCode: await bcryptjs.hash(resetCode, 4),
        resetCodeExpiration: new Date(Date.now() + 60_000),
      } as UserEntity;
      jest.mocked(userRepository.findOne).mockResolvedValue(user);
      jest.mocked(userRepository.save).mockResolvedValue(user);

      await service.resetPassword({
        email: 'user@example.com',
        newPassword: 'new-password',
        resetCode,
      });

      expect(user.resetCode).toBeNull();
      expect(user.resetCodeExpiration).toBeNull();
      expect(await bcryptjs.compare('new-password', user.password)).toBe(true);
      expect(userRepository.save).toHaveBeenCalledWith(user);
      expect(authSessionService.revokeAllForUser).toHaveBeenCalledWith(
        user.id,
      );
    });
  });
});
