import { errorDiagnostics } from 'src/common/exceptions/error-details';
import { FastPasswordConflictException } from './fast-password.policy';
import { In, IsNull, Not, Repository, DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { CreateUserDTO } from './models/create.user.dto';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { SiteService } from '../site/site.service';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { RolesService } from '../roles/roles.service';
import * as bcryptjs from 'bcryptjs';
import { stringConstants } from 'src/utils/string.constant';
import { UpdateUserDTO } from './models/update.user.dto';
import { MailService } from '../mail/mail.service';
import { generateRandomCode } from 'src/utils/general.functions';
import { SendCodeDTO } from './models/send.code.dto';
import { ResetPasswordDTO } from './models/reset.password.dto';
import { SetAppTokenDTO } from './models/set.app.token.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationDTO } from '../firebase/models/firebase.request.dto';
import { UsersPositionsEntity } from '../users/entities/users.positions.entity';
import { UpdateUserPartialDTO } from './models/update-user-partial.dto';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import {
  PLATFORM_ADMIN_ROLE,
  normalizeRole,
} from 'src/common/auth/roles.constants';
import { digestFastPassword } from '../auth/fast-password.crypto';
import { UserCreationPersistence } from './user-creation.persistence';
import { UserUpdatePersistence } from './user-update.persistence';
import { PasswordResetPersistence } from './password-reset.persistence';
import { UserLogoutPersistence } from './user-logout.persistence';
import { UserAdministrationActor, UserAdministrationPolicy } from 'src/common/auth/user-administration.policy';
import { PositionEntity } from '../position/entities/position.entity';
import { getActiveSiteMemberships } from 'src/common/auth/active-site-membership.policy';

@Injectable()
export class UsersService {
  private static readonly RESET_CODE_TTL_MS = 15 * 60 * 1000;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly siteService: SiteService,
    private readonly roleService: RolesService,
    private readonly mailService: MailService,
    private readonly firebaseService: FirebaseService,
    @InjectRepository(UsersPositionsEntity)
    private readonly usersPositionsRepository: Repository<UsersPositionsEntity>,
    private readonly logger: CustomLoggerService,
    private readonly whatsappService: WhatsappService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly userCreationPersistence: UserCreationPersistence,
    private readonly userUpdatePersistence: UserUpdatePersistence,
    private readonly passwordResetPersistence: PasswordResetPersistence,
    private readonly userLogoutPersistence: UserLogoutPersistence,
  ) {}

  async generateUniqueFastPassword(siteIds: number | number[]): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = 4;
    const normalizedSiteIds = Array.isArray(siteIds) ? siteIds : [siteIds];
    for (let attempt = 0; attempt < 100; attempt++) {
      const fastPassword = generateRandomCode(length, chars);
      const fastPasswordDigest = digestFastPassword(fastPassword);

      const existingUser = await this.userRepository.findOne({
        where: {
          fastPasswordDigest,
          userHasSites: {
            site: {
              id:
                normalizedSiteIds.length === 1
                  ? normalizedSiteIds[0]
                  : In(normalizedSiteIds),
            },
          },
        },
      });

      if (!existingUser) {
        return fastPassword;
      }
    }
    throw new FastPasswordConflictException();
  }

  private async sendFastPasswordWhatsAppMessage(phoneNumber: string, fastPassword: string, language?: string | null): Promise<void> {
    try {
      if (phoneNumber && fastPassword) {
        // Ensure language is valid, default to ES if null, undefined, or invalid
        const validLanguage = (language === stringConstants.LANG_EN) ? stringConstants.LANG_EN : stringConstants.LANG_ES;
        
        await this.whatsappService.sendAuthenticationMessages([{
          phoneNumber,
          code: fastPassword,
          language: validLanguage
        }]);
        this.logger.log(
          `WhatsApp authentication message sent successfully in language: ${validLanguage}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send WhatsApp authentication message: ${errorDiagnostics(error).driverCode ?? errorDiagnostics(error).errorType}`,
      );
    }
  }

  findUsersByPositionId = async (positionId: number) => {
    try {
      const position = await this.dataSource.getRepository(PositionEntity).findOne({
        where: { id: positionId, deletedAt: IsNull() },
      });
      if (!position) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.POSITION);
      }
      if (!position.siteId) return [];
      const siteId = Number(position.siteId);
      const users = await this.userRepository.find({
        where: {
          status: stringConstants.activeStatus,
          deletedAt: IsNull(),
          usersPositions: { position: { id: positionId }, deletedAt: IsNull() },
          userHasSites: {
            status: stringConstants.activeStatus,
            deletedAt: IsNull(),
            site: { id: siteId, status: stringConstants.activeStatus, deletedAt: IsNull() },
          },
        },
        relations: { userRoles: { role: true }, usersPositions: { position: true } },
      });

      const transformedUsers = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.userRoles.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name,
        })),
        positions: user.usersPositions
          .filter((assignment) =>
            !assignment.deletedAt && assignment.position &&
            !assignment.position.deletedAt && Number(assignment.position.siteId) === siteId,
          )
          .map(({ position }) => ({ id: position.id, name: position.name })),
      }));

      return transformedUsers;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  
  sendCodeToEmail = async (email: string, translation: typeof stringConstants.LANG_ES | typeof stringConstants.LANG_EN = stringConstants.LANG_ES) => {
    try {
      if (!email) {
        throw new ValidationException(ValidationExceptionType.EMAIL_MISSING);
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await this.userRepository.findOneBy({ email: normalizedEmail });

      if (!user) {
        return;
      }

      const resetCode = generateRandomCode(6);
      user.resetCode = await bcryptjs.hash(
        resetCode,
        stringConstants.SALT_ROUNDS,
      );
      user.resetCodeExpiration = new Date(
        Date.now() + UsersService.RESET_CODE_TTL_MS,
      );
      const result = await this.userRepository.update(
        { id: user.id, email: normalizedEmail },
        { resetCode: user.resetCode, resetCodeExpiration: user.resetCodeExpiration },
      );
      if (result.affected === 0) return;

      if (!email.endsWith('@fakeosm.com')) {
        await this.mailService.sendResetPasswordCode(user, resetCode, translation);
      }
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  verifyResetCode = async (sendCodeDTO: SendCodeDTO) => {
    try {
      const user = await this.userRepository.findOne({
        where: { email: sendCodeDTO.email.toLowerCase() },
      });

      if (!user) {
        throw new ValidationException(ValidationExceptionType.WRONG_RESET_CODE);
      }

      if (!user.resetCode || !user.resetCodeExpiration) {
        throw new ValidationException(ValidationExceptionType.WRONG_RESET_CODE);
      }

      if (new Date() > user.resetCodeExpiration) {
        throw new ValidationException(
          ValidationExceptionType.RESETCODE_EXPIRED,
        );
      }

      const isCodeValid = await bcryptjs.compare(
        sendCodeDTO.resetCode,
        user.resetCode,
      );

      if (!isCodeValid) {
        throw new ValidationException(ValidationExceptionType.WRONG_RESET_CODE);
      }

    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  resetPassword = async (resetPasswordDTO: ResetPasswordDTO) => {
    try {
      const passwordHash = await bcryptjs.hash(
        resetPasswordDTO.newPassword,
        stringConstants.SALT_ROUNDS,
      );
      await this.passwordResetPersistence.reset({
        email: resetPasswordDTO.email.trim().toLowerCase(),
        resetCode: resetPasswordDTO.resetCode,
        passwordHash,
        resetAt: new Date(),
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findOneByEmail = (email: string) => {
    if (typeof email !== 'string' || email.trim().length === 0) {
      throw new BadRequestException('Email is required');
    }

    return this.userRepository.findOne({
      where: { email: email },
      relations: { userHasSites: { site: true } },
    });
  };
  
  update = async (user: UserEntity) => {
    const exists = await this.userRepository.existsBy({ email: user.email });
    if (!exists) {
      throw new BadRequestException('The user does not exist');
    }
    return this.userRepository.save(user);
  };

  updateLastLogin = async (user: UserEntity) => {
    const exists = await this.userRepository.existsBy({ email: user.email });
    if (!exists) {
      throw new BadRequestException('The user does not exist');
    }
  
    return this.userRepository.update(user.id, {
      lastLoginWeb: user.lastLoginWeb,
      lastLoginApp: user.lastLoginApp,
      updatedAt: new Date(),
    });
  };
  
  getUserRoles = async (userId: number): Promise<string[]> => {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user || !user.userRoles) {
      return [];
    }

    return user.userRoles.map((userRole) => userRole.role.name);
  };

  findUserRoleIds = async (userId: number): Promise<number[]> => {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user || !user.userRoles) {
      return [];
    }

    return user.userRoles.map((userRole) => userRole.role.id);
  };

  findById = async (userId: number) => {
    return await this.userRepository.findOneBy({ id: userId });
  };

  findByIdWithSites = async (userId: number) => {
    return await this.userRepository.findOne({
      where: { id: userId },
      relations: { userHasSites: { site: true } },
    });
  };

  getAccessibleSiteIds = async (userId: number): Promise<number[] | null> => {
    const roles = await this.getUserRoles(userId);
    if (roles.map(normalizeRole).includes(PLATFORM_ADMIN_ROLE)) {
      return null;
    }

    const user = await this.findByIdWithSites(userId);
    if (!user?.userHasSites?.length) {
      throw new UnauthorizedException('User has no site access');
    }

    const activeSiteIds = [...new Set(getActiveSiteMemberships(user).map(({ site }) => Number(site.id)))];
    if (activeSiteIds.length === 0) {
      throw new UnauthorizedException('User has no active site access');
    }

    return activeSiteIds;
  };

  findSiteUsersResponsibleData = async (siteId: number) => {
    try {
      return await this.userRepository.find({
        where: { status: 'A', deletedAt: IsNull(), userHasSites: { status: 'A', deletedAt: IsNull(), site: { id: siteId, status: 'A', deletedAt: IsNull() } } },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getSiteUsersTokens = async (siteId: number, excludeWeb: boolean = false) => {
    try {
      const users = await this.userRepository.find({
        where: { status: 'A', deletedAt: IsNull(), userHasSites: { status: 'A', deletedAt: IsNull(), site: { id: siteId, status: 'A', deletedAt: IsNull() } } },
        select: ['androidToken', 'iosToken', 'webToken'],
      });

      const tokens = users.flatMap(user => [
        user.androidToken ? { token: user.androidToken, type: stringConstants.OS_ANDROID } : null,
        user.iosToken ? { token: user.iosToken, type: stringConstants.OS_IOS } : null,
        !excludeWeb && user.webToken ? { token: user.webToken, type: stringConstants.OS_WEB } : null
      ].filter(item => item !== null));

      return tokens;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getSiteUsersTokensExcludingOwnerUser = async (
    siteId: number,
    userId: number,
  ) => {
    try {
      const users = await this.userRepository.find({
        where: {
          userHasSites: { site: { id: siteId } },
          id: Not(userId),
        },
        select: ['androidToken', 'iosToken', 'webToken'],
      });

      const tokens = users.flatMap(user => [
        user.androidToken ? { token: user.androidToken, type: stringConstants.OS_ANDROID } : null,
        user.iosToken ? { token: user.iosToken, type: stringConstants.OS_IOS } : null,
        user.webToken ? { token: user.webToken, type: stringConstants.OS_WEB } : null
      ].filter(item => item !== null));
  
      return tokens;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  
  getUserToken = async (userId: number) => {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['androidToken', 'iosToken', 'webToken'],
      });

      if (!user) {
        return [];
      }

      const tokens = [
        user.androidToken ? { token: user.androidToken, type: stringConstants.OS_ANDROID } : null,
        user.iosToken ? { token: user.iosToken, type: stringConstants.OS_IOS } : null,
        user.webToken ? { token: user.webToken, type: stringConstants.OS_WEB } : null
      ].filter(item => item !== null);

      return tokens;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findAllUsers = async () => {
    try {
      const users = await this.userRepository.find({
        relations: { userRoles: { role: true }, userHasSites: { site: true } },
      });

      const transformedUsers = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.userRoles.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name,
        })),
        sites: user.userHasSites.map((userHasSite) => ({
          id: userHasSite.site.id,
          name: userHasSite.site.name,
          logo: userHasSite.site.logo,
        })),
      }));

      return transformedUsers;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteUsers = async (siteId: number) => {
    const users = await this.findUsersBySiteWithRoles(siteId);
    return users.map(user => ({ ...user, roles: user.roles.map(role => role.name).join(',') }));
  };

  getAdministrationActor = async (requesterId: number): Promise<UserAdministrationActor> => {
    const actor = { id: Number(requesterId), roles: [], siteIds: [] } as UserAdministrationActor;
    UserAdministrationPolicy.assertActor(actor);
    actor.roles = await this.getUserRoles(actor.id);
    actor.siteIds = await this.getAccessibleSiteIds(actor.id);
    return actor;
  };

  create = async (createUserDTO: CreateUserDTO, requesterId: number) => {
    try {
      const [site, roles] = await Promise.all([
        this.siteService.findById(createUserDTO.siteId),
        this.roleService.findRolesByIds(createUserDTO.roles),
      ]);

      if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      }
      const requestedRoleCount = new Set(createUserDTO.roles).size;
      if (roles.length !== requestedRoleCount) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.ROLES);
      }

      const normalizedEmail = createUserDTO.email.trim().toLowerCase();
      let fastPassword = createUserDTO.fastPassword;
      if (!fastPassword) {
        fastPassword = await this.generateUniqueFastPassword(
          createUserDTO.siteId,
        );
      }

      const createdAt = new Date();
      const actor = await this.getAdministrationActor(requesterId);
      const fastPasswordDigest = digestFastPassword(fastPassword);
      const result = await this.userCreationPersistence.persist({
        actor,
        email: normalizedEmail,
        newUser: {
          name: createUserDTO.name,
          email: normalizedEmail,
          phoneNumber: createUserDTO.phoneNumber,
          password: await bcryptjs.hash(
            createUserDTO.password,
            stringConstants.SALT_ROUNDS,
          ),
          fastPasswordDigest,
          appVersion: process.env.APP_ENV,
          siteCode: site.siteCode,
          uploadCardDataWithDataNet: createUserDTO.uploadCardDataWithDataNet,
          uploadCardEvidenceWithDataNet:
            createUserDTO.uploadCardEvidenceWithDataNet,
          translation: createUserDTO.translation || stringConstants.LANG_ES,
          status: createUserDTO.status || stringConstants.activeStatus,
          createdAt,
        },
        roles,
        site,
        createdAt,
      });

      if (
        result.user.phoneNumber &&
        (result.isNewUser || result.fastPasswordChanged)
      ) {
        void this.sendFastPasswordWhatsAppMessage(
          result.user.phoneNumber,
          fastPassword,
          createUserDTO.translation,
        );
      }
      const appUrl = process.env.URL_WEB;

      if (!result.user.email.endsWith('@fakeosm.com')) {
        this.mailService.sendWelcomeEmail(
          result.user,
          appUrl,
          createUserDTO.translation,
        ).catch((error) => {
          this.logger.logProcess(
            `[CREATE_USER] Welcome email for ${result.user.email} could not be sent, but the user was created successfully. Error: ${errorDiagnostics(error).driverCode ?? errorDiagnostics(error).errorType}`,
          );
        });
      }

      return result.userSite;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  
  updateUser = async (updateUserDTO: UpdateUserDTO, requesterId: number) => {
    try {
      this.logger.logProcess(`[UPDATE_USER] Starting update for user_id: ${updateUserDTO.id}`);

      const [site, roles] = await Promise.all([
        this.siteService.findById(updateUserDTO.siteId),
        this.roleService.findRolesByIds(updateUserDTO.roles),
      ]);

      if (!site) throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      const requestedRoleCount = new Set(updateUserDTO.roles).size;
      if (roles.length !== requestedRoleCount) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.ROLES);
      }

      const updatedAt = new Date();
      const updatePayload: Partial<UserEntity> = {
        name: updateUserDTO.name,
        email: updateUserDTO.email.trim().toLowerCase(),
        status: updateUserDTO.status,
        siteId: site.id,
        siteCode: site.siteCode,
        appVersion: process.env.APP_ENV,
        uploadCardDataWithDataNet: updateUserDTO.uploadCardDataWithDataNet,
        uploadCardEvidenceWithDataNet: updateUserDTO.uploadCardEvidenceWithDataNet,
        phoneNumber: updateUserDTO.phoneNumber,
        translation: updateUserDTO.translation || stringConstants.LANG_ES,
        updatedAt,
      };

      if (updateUserDTO.password) {
        updatePayload.password = await bcryptjs.hash(
          updateUserDTO.password,
          stringConstants.SALT_ROUNDS,
        );
        updatePayload.resetCode = null;
        updatePayload.resetCodeExpiration = null;
      }
  
      let fastPasswordDigest: string | undefined;
      if (updateUserDTO.fastPassword) {
        fastPasswordDigest = digestFastPassword(updateUserDTO.fastPassword);
      }

      const revokeAllSessions =
        Boolean(updateUserDTO.password) ||
        updateUserDTO.status === stringConstants.inactiveStatus ||
        updateUserDTO.status === stringConstants.cancelledStatus;
      const result = await this.userUpdatePersistence.persist({
        actor: await this.getAdministrationActor(requesterId),
        userId: updateUserDTO.id,
        siteId: site.id,
        update: updatePayload,
        roles,
        fastPasswordDigest,
        revokeAllSessions,
        updatedAt,
      });

      this.logger.logProcess(`[UPDATE_USER] User updated successfully. ID: ${result.user.id}`);

      if (
        updateUserDTO.fastPassword &&
        result.user.phoneNumber &&
        result.fastPasswordChanged
      ) {
        try {
          await this.sendFastPasswordWhatsAppMessage(
            result.user.phoneNumber,
            updateUserDTO.fastPassword,
            result.user.translation,
          );
        } catch (notificationError) {
          this.logger.error(
            `[UPDATE_USER] Fast Password notification failed for user_id: ${result.user.id}. Error: ${notificationError.message}`,
          );
        }
      }

      if (updateUserDTO.status === stringConstants.inactiveStatus || updateUserDTO.status === stringConstants.cancelledStatus) {
        try {
          const tokens = await this.getUserToken(result.user.id);
          if (tokens?.length > 0) {
            await this.firebaseService.sendMultipleMessage(
              new NotificationDTO(
                stringConstants.closeSessionTitle,
                stringConstants.closeSessionDescription,
                stringConstants.closeSessionType,
              ),
              tokens,
            );
          }
        } catch (notificationError) {
          this.logger.error(
            `[UPDATE_USER] Session close notification failed for user_id: ${result.user.id}. Error: ${notificationError.message}`,
          );
        }
      }

      return result.user;
    } catch (exception) {
      this.logger.logProcess(`[UPDATE_USER] Error in update: ${errorDiagnostics(exception).driverCode ?? errorDiagnostics(exception).errorType}`);
      HandleException.exception(exception);
    }
  };

  updateUserPartial = async (updateUserPartialDTO: UpdateUserPartialDTO, requesterId: number) => {
    try {
      const updatedAt = new Date();
      const updatePayload: Partial<UserEntity> = {};

      if (updateUserPartialDTO.email) {
        updatePayload.email = updateUserPartialDTO.email.trim().toLowerCase();
      }
      if (updateUserPartialDTO.name !== undefined) {
        updatePayload.name = updateUserPartialDTO.name;
      }
      if (updateUserPartialDTO.phoneNumber !== undefined) {
        updatePayload.phoneNumber = updateUserPartialDTO.phoneNumber;
      }
      if (updateUserPartialDTO.translation !== undefined) {
        updatePayload.translation = updateUserPartialDTO.translation;
      }
      if (updateUserPartialDTO.password) {
        updatePayload.password = await bcryptjs.hash(
          updateUserPartialDTO.password,
          stringConstants.SALT_ROUNDS,
        );
        updatePayload.resetCode = null;
        updatePayload.resetCodeExpiration = null;
      }

      let fastPasswordDigest: string | undefined;
      if (updateUserPartialDTO.fastPassword) {
        if (!/^[a-zA-Z0-9]{4}$/.test(updateUserPartialDTO.fastPassword)) {
          throw new ValidationException(
            ValidationExceptionType.INVALID_FAST_PASSWORD_FORMAT,
          );
        }
        fastPasswordDigest = digestFastPassword(
          updateUserPartialDTO.fastPassword,
        );
      }

      const result = await this.userUpdatePersistence.persistPartial({
        actor: await this.getAdministrationActor(requesterId),
        userId: updateUserPartialDTO.id,
        update: updatePayload,
        fastPasswordDigest,
        updatedAt,
      });
      if (
        updateUserPartialDTO.fastPassword &&
        result.fastPasswordChanged &&
        result.user.phoneNumber
      ) {
        await this.sendFastPasswordWhatsAppMessage(
          result.user.phoneNumber,
          updateUserPartialDTO.fastPassword,
          result.user.translation,
        );
      }

      return result.user;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findOneById = async (userId: number) => {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: { userRoles: { role: true }, userHasSites: { site: true } },
      });
      if (user) {
        const transformedUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.userRoles.map((userRoles) => userRoles.role.id),
          sites: user.userHasSites.map((userHasSite) => ({
            id: userHasSite.site.id,
            name: userHasSite.site.name,
            logo: userHasSite.site.logo,
          })),
          uploadCardDataWithDataNet: user.uploadCardDataWithDataNet,
          uploadCardEvidenceWithDataNet: user.uploadCardEvidenceWithDataNet,
          status: user.status,
        };
        return transformedUser;
      }
      return user;
    } catch (exception) {

      HandleException.exception(exception);
    }
  };

  firebaseAppToken = async (setAppTokenDTO: SetAppTokenDTO) => { 
    try {
      const user = await this.userRepository.findOneBy({
        id: setAppTokenDTO.userId,
      });
  
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }
  
      const tokenFields: Partial<Pick<UserEntity,
        'androidToken' | 'androidVersion' | 'iosToken' | 'iosVersion' |
        'webToken' | 'webVersion' | 'updatedAt'
      >> = { updatedAt: new Date() };

      switch (setAppTokenDTO.osName) {
        case stringConstants.OS_ANDROID:
          tokenFields.androidToken = setAppTokenDTO.appToken;
          tokenFields.androidVersion = setAppTokenDTO.osVersion;
          break;
        case stringConstants.OS_IOS:
          tokenFields.iosToken = setAppTokenDTO.appToken;
          tokenFields.iosVersion = setAppTokenDTO.osVersion;
          break;
        case stringConstants.OS_WEB:
          tokenFields.webToken = setAppTokenDTO.appToken;
          tokenFields.webVersion = setAppTokenDTO.osVersion;
          break;
        default:
          throw new Error('OS no reconocido');
      }
  
      const result = await this.userRepository.update(user.id, tokenFields);
      if (result.affected === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }
      const updatedUser = await this.userRepository.findOneBy({ id: user.id });
      if (!updatedUser) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }
      return updatedUser;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  logout = async (userId: number, osName: string, sessionId: string) => {
    try {
      return await this.userLogoutPersistence.logout({
        userId,
        sessionId,
        requestedPlatform: osName,
        loggedOutAt: new Date(),
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
  findSiteMechanics = async (siteId: number) => {
    try {
      return await this.userRepository.find({
        where: {
          userHasSites: { site: { id: siteId } },
          userRoles: { role: { name: stringConstants.mechanic } },
        },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getExistingUsersInSite = async (data: any, siteId: number) => {
    const emails = data
      .map((user) => user.Email?.trim().toLowerCase())
      .filter(Boolean);
    if (emails.length === 0) return [];

    const existingUsers = await this.userRepository.find({
      where: {
        email: In(emails),
        userHasSites: { site: { id: siteId } },
      },
    });
    return existingUsers;
  };
  getExistingUsersMap = async (data: any): Promise<Map<string, UserEntity>> => {
    const emails = data
      .map((user) => user.Email?.trim().toLowerCase())
      .filter(Boolean);
    if (emails.length === 0) return new Map();

    const existingUsers = await this.userRepository.find({
      where: {
        email: In(emails),
      },
    });

    const userMap = new Map(existingUsers.map((user) => [user.email, user]));
    return userMap;
  };

  async findUsersByRole(siteId: number, roleName: string) {
    try {
      const users = await this.userRepository.find({
        where: {
          userHasSites: { site: { id: siteId } },
          userRoles: { role: { name: roleName } },
        },
      });
  
      return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
  findPositionsByUserId = async (userId: number, sessionSiteId?: number) => {
    try {
      const user = await this.findByIdWithSites(userId);
      const siteIds = getActiveSiteMemberships(user).map(({ site }) => Number(site.id)).filter(id => sessionSiteId === undefined || id === sessionSiteId);
      if (siteIds.length === 0) return [];
      const userPositions = await this.usersPositionsRepository.find({
        where: {
          user: { id: userId },
          deletedAt: IsNull(),
          position: { siteId: In(siteIds), status: 'A', deletedAt: IsNull() },
        },
        relations: { position: true },
      });
  
      return userPositions.map(({ position }) => ({
        id: position.id,
        name: position.name,
        description: position.description,
        route: position.route,
        levelId: position.levelId,
        levelName: position.levelName,
        areaId: position.areaId,
        areaName: position.areaName,
        siteId: position.siteId,
        siteName: position.siteName,
        siteType: position.siteType,
        status: position.status,
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };  

  findUsersBySiteWithRoles = async (siteId: number) => {
    try {
      const users = await this.userRepository.find({
        where: { status: 'A', deletedAt: IsNull(), userHasSites: { status: 'A', deletedAt: IsNull(), site: { id: siteId, status: 'A', deletedAt: IsNull() } } },
        relations: { 
          userRoles: { role: true },
          userHasSites: { site: true }
        },
      });

      return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.userRoles.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name
        })),
        sites: getActiveSiteMemberships(user).filter(({ site }) => Number(site.id) === Number(siteId)).map((userHasSite) => ({
          id: userHasSite.site.id,
          name: userHasSite.site.name,
          logo: userHasSite.site.logo
        }))
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findUsersBySiteWithPositions = async (siteId: number) => {
    try {
      const users = await this.userRepository.find({
        where: { status: 'A', deletedAt: IsNull(), userHasSites: { status: 'A', deletedAt: IsNull(), site: { id: siteId, status: 'A', deletedAt: IsNull() } } },
        relations: { 
          usersPositions: { position: true }
        },
      });

      return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        positions: (user.usersPositions ?? []).filter(link => !link.deletedAt && Number(link.siteId) === Number(siteId) && link.position?.status === 'A' && !link.position.deletedAt && Number(link.position.siteId) === Number(siteId)).map((userPosition) => ({
          id: userPosition.position.id,
          name: userPosition.position.name,
          description: userPosition.position.description,
          route: userPosition.position.route,
          levelId: userPosition.position.levelId,
          levelName: userPosition.position.levelName,
          areaId: userPosition.position.areaId,
          areaName: userPosition.position.areaName,
          siteId: userPosition.position.siteId,
          siteName: userPosition.position.siteName,
          siteType: userPosition.position.siteType,
          status: userPosition.position.status
        }))
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findOneByFastPassword = async (fastPassword: string, siteId: number) => {
    const users = await this.userRepository.find({
      where: {
        status: stringConstants.activeStatus,
        deletedAt: IsNull(),
        fastPasswordDigest: digestFastPassword(fastPassword),
        userHasSites: {
          status: stringConstants.activeStatus,
          deletedAt: IsNull(),
          site: { id: siteId, status: stringConstants.activeStatus, deletedAt: IsNull() },
        },
      },
      relations: { userHasSites: { site: true } },
      take: 2,
    });
    return users.length === 1 ? users[0] : null;
  };

  findOneByPhoneNumber = async (phoneNumber: string) => {
    const users = await this.userRepository.find({
      where: { phoneNumber },
      relations: { userHasSites: { site: true } },
      take: 2,
    });
    return users.length === 1 ? users[0] : null;
  };

  sendFastPasswordWhatsApp = async (phoneNumber: string, fastPassword: string, language?: string | null): Promise<void> => {
    await this.sendFastPasswordWhatsAppMessage(phoneNumber, fastPassword, language);
  };

  rotateFastPasswordAndSend = async (user: UserEntity): Promise<void> => {
    const siteIds = [
      ...new Set([
        ...(user.userHasSites?.map(({ site }) => site.id) ?? []),
        ...(user.siteId ? [user.siteId] : []),
      ]),
    ];
    if (siteIds.length === 0 || !user.phoneNumber) {
      return;
    }

    const fastPassword = await this.generateUniqueFastPassword(siteIds);
    const result = await this.userUpdatePersistence.persistPartial({
      // Recovery has already identified the account through its registered phone.
      actor: { id: Number(user.id), roles: [], siteIds: [] },
      userId: user.id,
      update: {},
      fastPasswordDigest: digestFastPassword(fastPassword),
      updatedAt: new Date(),
    });
    await this.sendFastPasswordWhatsAppMessage(
      result.user.phoneNumber,
      fastPassword,
      result.user.translation,
    );
  };

  private async validateSiteAccess(siteId: number, userId: number): Promise<void> {
    const accessibleSiteIds = await this.getAccessibleSiteIds(userId);
    if (accessibleSiteIds === null) {
      return;
    }

    if (!accessibleSiteIds.includes(siteId)) {
      throw new UnauthorizedException();
    }
  }

  /**
   * Get user preferences including card count for a site
   * - Counts all active cards (status 'A')
   * - For other statuses, only counts cards within app_history_days
   */
  preferences = async (siteId: number, userId: number) => {
    try {
      // Validate user has access to the site
      await this.validateSiteAccess(siteId, userId);

      // Get site to retrieve app_history_days
      const site = await this.siteService.findById(siteId);
      if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      }

      // Build query with status and date filtering using DataSource
      const queryBuilder = this.dataSource.createQueryBuilder()
        .select('COUNT(*)', 'total')
        .from('cards', 'card')
        .where('card.site_id = :siteId', { siteId });

      // Apply status filtering logic:
      // - Always include status 'A'
      // - For other statuses (C, R, etc), filter by app_history_days
      const historyDays = site.appHistoryDays || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - historyDays);
      const cutoffDateString = cutoffDate.toISOString().split('T')[0];

      queryBuilder.andWhere(
        '(card.status = :statusA OR (card.status != :statusA AND card.card_creation_date >= :cutoffDate))',
        { statusA: 'A', cutoffDate: cutoffDateString }
      );

      const result = await queryBuilder.getRawOne();

      return { total: Number(result.total) };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
