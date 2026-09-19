import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';
import { MailService } from '../mail/mail.service';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import * as bcryptjs from 'bcryptjs';
import { SiteService } from '../site/site.service';
import { RolesService } from '../roles/roles.service';
import { UserCreationPersistence } from './user-creation.persistence';
import { UserUpdatePersistence } from './user-update.persistence';
import { NotFoundCustomException } from 'src/common/exceptions/types/notFound.exception';
import { stringConstants } from 'src/utils/string.constant';
import { PasswordResetPersistence } from './password-reset.persistence';
import { UserLogoutPersistence } from './user-logout.persistence';

describe('UsersService', () => {
  const userRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<UserEntity>;

  const mailService = {
    sendResetPasswordCode: jest.fn(),
  } as unknown as MailService;
  const siteService = {
    findById: jest.fn(),
  } as unknown as SiteService;
  const roleService = {
    findRolesByIds: jest.fn(),
  } as unknown as RolesService;
  const userCreationPersistence = {
    persist: jest.fn(),
  } as unknown as UserCreationPersistence;
  const userUpdatePersistence = {
    persist: jest.fn(),
    persistPartial: jest.fn(),
  } as unknown as UserUpdatePersistence;
  const passwordResetPersistence = {
    reset: jest.fn(),
  } as unknown as PasswordResetPersistence;
  const userLogoutPersistence = {
    logout: jest.fn(),
  } as unknown as UserLogoutPersistence;
  const logger = {
    log: jest.fn(),
    logProcess: jest.fn(),
    error: jest.fn(),
  };
  const whatsappService = {
    sendAuthenticationMessages: jest.fn(),
  };

  const service = Reflect.construct(UsersService, [
    userRepository,
    siteService,
    roleService,
    mailService,
    undefined,
    undefined,
    logger,
    whatsappService,
    undefined,
    userCreationPersistence,
    userUpdatePersistence,
    passwordResetPersistence,
    userLogoutPersistence,
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

  describe('updateUser', () => {
    it('preserves the Fast Password when the request omits it', async () => {
      jest.mocked(siteService.findById).mockResolvedValue({
        id: 3,
        siteCode: 'SITE03',
      } as any);
      jest.mocked(roleService.findRolesByIds).mockResolvedValue([
        { id: 1, name: 'operator' },
      ] as any);
      jest.mocked(userUpdatePersistence.persist).mockResolvedValue({
        user: {
          id: 7,
          email: 'user@example.com',
          phoneNumber: '521234567890',
          translation: stringConstants.LANG_ES,
        } as UserEntity,
        fastPasswordChanged: false,
      });
      const generateFastPassword = jest.spyOn(
        service,
        'generateUniqueFastPassword',
      );

      await service.updateUser({
        id: 7,
        name: 'User',
        email: ' USER@example.com ',
        phoneNumber: '521234567890',
        siteId: 3,
        password: undefined,
        uploadCardDataWithDataNet: 0,
        uploadCardEvidenceWithDataNet: 0,
        roles: [1],
        status: stringConstants.activeStatus,
        translation: stringConstants.LANG_ES,
      });

      expect(generateFastPassword).not.toHaveBeenCalled();
      expect(userUpdatePersistence.persist).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 7,
          siteId: 3,
          fastPasswordDigest: undefined,
          revokeAllSessions: false,
          update: expect.objectContaining({ email: 'user@example.com' }),
        }),
      );
    });

    it('rejects the update when any requested role does not exist', async () => {
      jest.mocked(siteService.findById).mockResolvedValue({
        id: 3,
        siteCode: 'SITE03',
      } as any);
      jest.mocked(roleService.findRolesByIds).mockResolvedValue([
        { id: 1, name: 'operator' },
      ] as any);

      await expect(
        service.updateUser({
          id: 7,
          name: 'User',
          email: 'user@example.com',
          phoneNumber: '521234567890',
          siteId: 3,
          password: undefined,
          uploadCardDataWithDataNet: 0,
          uploadCardEvidenceWithDataNet: 0,
          roles: [1, 999],
          status: stringConstants.activeStatus,
          translation: stringConstants.LANG_ES,
        }),
      ).rejects.toBeInstanceOf(NotFoundCustomException);
      expect(userUpdatePersistence.persist).not.toHaveBeenCalled();
    });
  });

  describe('updateUserPartial', () => {
    it('normalizes and persists every supported profile field', async () => {
      jest.mocked(userUpdatePersistence.persistPartial).mockImplementation(
        async ({ userId, update }) => ({
          user: { id: userId, ...update } as UserEntity,
          fastPasswordChanged: false,
        }),
      );

      const result = await service.updateUserPartial({
        id: 7,
        name: 'Updated User',
        email: ' UPDATED@example.com ',
        phoneNumber: '521234567890',
        translation: stringConstants.LANG_EN,
      });

      expect(userUpdatePersistence.persistPartial).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 7,
          update: {
            name: 'Updated User',
            email: 'updated@example.com',
            phoneNumber: '521234567890',
            translation: stringConstants.LANG_EN,
          },
          fastPasswordDigest: undefined,
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 7,
          email: 'updated@example.com',
          phoneNumber: '521234567890',
          translation: stringConstants.LANG_EN,
        }),
      );
    });

    it('invalidates recovery codes when changing the password', async () => {
      jest.mocked(userUpdatePersistence.persistPartial).mockImplementation(
        async ({ userId, update }) => ({
          user: { id: userId, ...update } as UserEntity,
          fastPasswordChanged: false,
        }),
      );

      await service.updateUserPartial({
        id: 7,
        password: 'new-password',
      });

      const input = jest.mocked(userUpdatePersistence.persistPartial).mock
        .calls[0][0];
      expect(input.update.resetCode).toBeNull();
      expect(input.update.resetCodeExpiration).toBeNull();
      expect(
        await bcryptjs.compare(
          'new-password',
          input.update.password as string,
        ),
      ).toBe(true);
    });
  });

  describe('logout', () => {
    it('delegates token cleanup and session revocation to one transaction', async () => {
      const user = { id: 7, androidToken: null } as UserEntity;
      jest.mocked(userLogoutPersistence.logout).mockResolvedValue(user);

      await expect(
        service.logout(7, stringConstants.OS_ANDROID, 'primary-session-id'),
      ).resolves.toBe(user);
      expect(userLogoutPersistence.logout).toHaveBeenCalledWith({
        userId: 7,
        sessionId: 'primary-session-id',
        requestedPlatform: stringConstants.OS_ANDROID,
        loggedOutAt: expect.any(Date),
      });
    });
  });

  describe('Fast Password recovery', () => {
    it('does not select an arbitrary account when a phone is duplicated', async () => {
      jest.mocked(userRepository.find).mockResolvedValue([
        { id: 7, phoneNumber: '521234567890' },
        { id: 8, phoneNumber: '521234567890' },
      ] as UserEntity[]);

      await expect(
        service.findOneByPhoneNumber('521234567890'),
      ).resolves.toBeNull();
      expect(userRepository.find).toHaveBeenCalledWith({
        where: { phoneNumber: '521234567890' },
        relations: { userHasSites: { site: true } },
        take: 2,
      });
    });

    it('rotates the digest and Fast Password sessions in one transaction', async () => {
      const previousPepper = process.env.FAST_PASSWORD_PEPPER;
      process.env.FAST_PASSWORD_PEPPER =
        '0123456789abcdef0123456789abcdef';
      const user = {
        id: 7,
        phoneNumber: '521234567890',
        translation: stringConstants.LANG_ES,
        userHasSites: [{ site: { id: 2 } }, { site: { id: 3 } }],
      } as UserEntity;
      jest
        .spyOn(service, 'generateUniqueFastPassword')
        .mockResolvedValue('AB12');
      jest.mocked(userUpdatePersistence.persistPartial).mockResolvedValue({
        user,
        fastPasswordChanged: true,
      });
      jest
        .mocked(whatsappService.sendAuthenticationMessages)
        .mockResolvedValue(undefined);

      try {
        await service.rotateFastPasswordAndSend(user);

        expect(service.generateUniqueFastPassword).toHaveBeenCalledWith([
          2, 3,
        ]);
        expect(userUpdatePersistence.persistPartial).toHaveBeenCalledWith({
          userId: user.id,
          update: {},
          fastPasswordDigest: expect.any(String),
          updatedAt: expect.any(Date),
        });
        expect(
          whatsappService.sendAuthenticationMessages,
        ).toHaveBeenCalledWith([
          {
            phoneNumber: user.phoneNumber,
            code: 'AB12',
            language: stringConstants.LANG_ES,
          },
        ]);
      } finally {
        if (previousPepper === undefined) {
          delete process.env.FAST_PASSWORD_PEPPER;
        } else {
          process.env.FAST_PASSWORD_PEPPER = previousPepper;
        }
      }
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
      jest.mocked(passwordResetPersistence.reset).mockRejectedValue(
        new ValidationException(ValidationExceptionType.RESETCODE_EXPIRED),
      );

      await expect(
        service.resetPassword({
          email: 'user@example.com',
          newPassword: 'new-password',
          resetCode: 'ABC123',
        }),
      ).rejects.toBeInstanceOf(ValidationException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('consumes a valid code after changing the password', async () => {
      const resetCode = 'ABC123';
      jest.mocked(passwordResetPersistence.reset).mockResolvedValue();

      await service.resetPassword({
        email: ' USER@example.com ',
        newPassword: 'new-password',
        resetCode,
      });

      const input = jest.mocked(passwordResetPersistence.reset).mock.calls[0][0];
      expect(input.email).toBe('user@example.com');
      expect(input.resetCode).toBe(resetCode);
      expect(await bcryptjs.compare('new-password', input.passwordHash)).toBe(
        true,
      );
    });
  });
});
