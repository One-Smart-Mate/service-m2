import { In, Not, Repository, DataSource } from 'typeorm';
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
import { UserHasSitesEntity } from './entities/user.has.sites.entity';
import { CreateUsersDTO } from '../file-upload/dto/create.users.dto';
import { UsersAndSitesDTO } from '../file-upload/dto/users.and.sites.dto';
import { UsersPositionsEntity } from '../users/entities/users.positions.entity';
import { UpdateUserPartialDTO } from './models/update-user-partial.dto';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserHasSitesEntity)
    private readonly userHasSiteRepository: Repository<UserHasSitesEntity>,
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
  ) {}

  async generateUniqueFastPassword(siteId: number): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 4;
    while (true) {
      const fastPassword = Array.from({ length }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length)),
      ).join('');

      const existingUser = await this.userRepository.findOne({
        where: {
          fastPassword,
          userHasSites: { site: { id: siteId } },
        },
      });

      if (!existingUser) {
        return fastPassword;
      }
    }
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
        this.logger.log(`WhatsApp authentication message sent to ${phoneNumber} with fastPassword: ${fastPassword} in language: ${validLanguage}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp authentication message to ${phoneNumber}: ${error.message}`);
    }
  }

  findUsersByPositionId = async (positionId: number) => {
    try {
      const users = await this.userRepository.find({
        where: { usersPositions: { position: { id: positionId } } },
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
        positions: user.usersPositions.map((usersPosition) => ({
          id: usersPosition.position.id,
          name: usersPosition.position.name,
        })),
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

      const user = await this.userRepository.findOneBy({ email });

      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const resetCode = generateRandomCode(6);
      user.resetCode = await await bcryptjs.hash(
        resetCode,
        stringConstants.SALT_ROUNDS,
      );
      user.resetCodeExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await this.userRepository.save(user);

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
        where: { email: sendCodeDTO.email },
      });

      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const isCodeValid = await bcryptjs.compare(
        sendCodeDTO.resetCode,
        user.resetCode,
      );

      if (!isCodeValid) {
        throw new ValidationException(ValidationExceptionType.WRONG_RESET_CODE);
      }

      if (new Date() > user.resetCodeExpiration) {
        throw new ValidationException(
          ValidationExceptionType.RESETCODE_EXPIRED,
        );
      }
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  resetPassword = async (resetPasswordDTO: ResetPasswordDTO) => {
    try {
      const user = await this.userRepository.findOne({
        where: { email: resetPasswordDTO.email },
      });

      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const isCodeValid = await bcryptjs.compare(
        resetPasswordDTO.resetCode,
        user.resetCode,
      );

      if (!isCodeValid) {
        throw new ValidationException(ValidationExceptionType.WRONG_RESET_CODE);
      }

      user.password = await await bcryptjs.hash(
        resetPasswordDTO.newPassword,
        stringConstants.SALT_ROUNDS,
      );
      user.resetCode = null;
      user.resetCodeExpiration = null;
      user.updatedAt = new Date();
      await this.userRepository.save(user);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findOneByEmail = (email: string) => {
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

  findSiteUsersResponsibleData = async (siteId: number) => {
    try {
      return await this.userRepository.find({
        where: { userHasSites: { site: { id: siteId } } },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getSiteUsersTokens = async (siteId: number, excludeWeb: boolean = false) => {
    try {
      const users = await this.userRepository.find({
        where: { userHasSites: { site: { id: siteId } } },
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
    try {
      // Optimized query using QueryBuilder with selective joins
      const users = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.userHasSites', 'userHasSite')
        .innerJoin('userHasSite.site', 'site')
        .leftJoin('user.userRoles', 'userRole')
        .leftJoin('userRole.role', 'role')
        .leftJoin('user.userHasSites', 'allUserHasSites')
        .leftJoin('allUserHasSites.site', 'allSites')
        .where('userHasSite.site.id = :siteId', { siteId })
        .select([
          'user.id',
          'user.name',
          'user.email',
          'role.name',
          'allSites.id',
          'allSites.name',
          'allSites.logo',
        ])
        .getMany();

      const transformedUsers = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.userRoles?.map((userRole) => userRole.role.name).join(',') || '',
        sites: user.userHasSites?.map((userHasSite) => ({
          id: userHasSite.site.id,
          name: userHasSite.site.name,
          logo: userHasSite.site.logo,
        })) || [],
      }));

      return transformedUsers;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createUserDTO: CreateUserDTO) => {
    try {
      const userAlreadyExistInSite = await this.userRepository.existsBy({
        email: createUserDTO.email,
        userHasSites: { site: { id: createUserDTO.siteId } },
      });

      if (userAlreadyExistInSite) {
        throw new ValidationException(ValidationExceptionType.DUPLICATED_USER);
      }

      const [site, roles] = await Promise.all([
        this.siteService.findById(createUserDTO.siteId),
        this.roleService.findRolesByIds(createUserDTO.roles),
      ]);

      if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      } else if (roles.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.ROLES);
      }

      const user = await this.userRepository.findOne({
        where: { email: createUserDTO.email },
      });

      const userSite = new UserHasSitesEntity();
      userSite.site = site;

      let fastPassword = createUserDTO.fastPassword;
      if (!fastPassword) {
        fastPassword = await this.generateUniqueFastPassword(
          createUserDTO.siteId,
        );
      }

      if (!user) {
        const createUser = await this.userRepository.create({
          name: createUserDTO.name,
          email: createUserDTO.email,
          phoneNumber: createUserDTO.phoneNumber,
          password: await bcryptjs.hash(
            createUserDTO.password,
            stringConstants.SALT_ROUNDS,
          ),
          fastPassword,
          appVersion: process.env.APP_ENV,
          siteCode: site.siteCode,
          uploadCardDataWithDataNet: createUserDTO.uploadCardDataWithDataNet,
          uploadCardEvidenceWithDataNet:
            createUserDTO.uploadCardEvidenceWithDataNet,
          translation: createUserDTO.translation || stringConstants.LANG_ES,
          status: createUserDTO.status || stringConstants.activeStatus,
          createdAt: new Date(),
        });

        await this.userRepository.save(createUser);
        await this.roleService.assignUserRoles(createUser, roles);
        userSite.user = createUser;

        if (createUser.phoneNumber && fastPassword) {
          this.sendFastPasswordWhatsAppMessage(createUser.phoneNumber, fastPassword, createUserDTO.translation);
        }
      } else {
        const oldFastPassword = user.fastPassword;
        user.fastPassword = fastPassword;
        await this.userRepository.save(user);
        userSite.user = user;

        if (user.phoneNumber && fastPassword && oldFastPassword !== fastPassword) {
          this.sendFastPasswordWhatsAppMessage(user.phoneNumber, fastPassword, createUserDTO.translation);
        }
      }
      const appUrl = process.env.URL_WEB;

      if (!userSite.user.email.endsWith('@fakeosm.com')) {
        this.mailService.sendWelcomeEmail(
          userSite.user,
          appUrl,
          createUserDTO.translation,
        ).catch((error) => {
          this.logger.logProcess(
            `[CREATE_USER] Welcome email for ${userSite.user.email} could not be sent, but the user was created successfully. Error: ${error.message}`,
          );
        });
      }

      return await this.userHasSiteRepository.save(userSite);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  
  updateUser = async (updateUserDTO: UpdateUserDTO) => {
    try {
      this.logger.logProcess(`[UPDATE_USER] Starting update for user_id: ${updateUserDTO.id}`);
  
      const [user, site, roles] = await Promise.all([
        this.userRepository.findOneBy({ id: updateUserDTO.id }),
        this.siteService.findById(updateUserDTO.siteId),
        this.roleService.findRolesByIds(updateUserDTO.roles),
      ]);
  
      if (!user) throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      if (!site) throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      if (roles.length === 0) throw new NotFoundCustomException(NotFoundCustomExceptionType.ROLES);
  
      const emailIsNotUnique = await this.userRepository.exists({
        where: {
          email: updateUserDTO.email,
          id: Not(updateUserDTO.id),
          siteCode: site.siteCode,
        },
      });
      if (emailIsNotUnique) throw new ValidationException(ValidationExceptionType.DUPLICATED_USER);
  
      let updatePayload: Partial<UserEntity> = {
        name: updateUserDTO.name,
        email: updateUserDTO.email,
        status: updateUserDTO.status,
        siteId: site.id,
        siteCode: site.siteCode,
        appVersion: process.env.APP_ENV,
        uploadCardDataWithDataNet: updateUserDTO.uploadCardDataWithDataNet,
        uploadCardEvidenceWithDataNet: updateUserDTO.uploadCardEvidenceWithDataNet,
        phoneNumber: updateUserDTO.phoneNumber,
        translation: updateUserDTO.translation || stringConstants.LANG_ES,
        updatedAt: new Date(),
      };
  
      if (updateUserDTO.password) {
        updatePayload.password = await bcryptjs.hash(
          updateUserDTO.password,
          stringConstants.SALT_ROUNDS,
        );
      }
  
      if (!updateUserDTO.fastPassword) {
        updatePayload.fastPassword = await this.generateUniqueFastPassword(
          site.id,
        );
      } else {
        if (!/^[a-zA-Z0-9]{4}$/.test(updateUserDTO.fastPassword)) {
          throw new ValidationException(
            ValidationExceptionType.INVALID_FAST_PASSWORD_FORMAT,
          );
        }

        const existingUser = await this.userRepository.findOne({
          where: {
            fastPassword: updateUserDTO.fastPassword,
            userHasSites: { site: { id: site.id } },
            id: Not(updateUserDTO.id),
          },
        });

        if (existingUser) {
          throw new ValidationException(ValidationExceptionType.DUPLICATED_USER);
        }

        updatePayload.fastPassword = updateUserDTO.fastPassword;
      }
  
      const oldFastPassword = user.fastPassword;
      this.logger.logProcess(`[UPDATE_USER] Updating user with ID: ${user.id}`);
      await this.userRepository.update({ id: user.id }, updatePayload);
      this.logger.logProcess(`[UPDATE_USER] User updated successfully. ID: ${user.id}`);

      if (updatePayload.phoneNumber && updatePayload.fastPassword && oldFastPassword !== updatePayload.fastPassword) {
        await this.sendFastPasswordWhatsAppMessage(updatePayload.phoneNumber, updatePayload.fastPassword, updatePayload.translation);
      }
  
      if (updateUserDTO.status === stringConstants.inactiveStatus || updateUserDTO.status === stringConstants.cancelledStatus) {
        const tokens = await this.getUserToken(user.id);
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
      }

      return await this.roleService.updateUserRoles(user, roles);
    } catch (exception) {
      this.logger.logProcess(`[UPDATE_USER] Error in update: ${exception.message}`);
      console.log(exception);
      HandleException.exception(exception);
    }
  };

  updateUserPartial = async (updateUserPartialDTO: UpdateUserPartialDTO) => {
    try {
      const user = await this.userRepository.findOne({
        where: { id: updateUserPartialDTO.id },
      });
      
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }
      
      if (updateUserPartialDTO.email && updateUserPartialDTO.email !== user.email) {
        const emailIsNotUnique = await this.userRepository.exists({
          where: { email: updateUserPartialDTO.email, id: Not(updateUserPartialDTO.id) },
        });
        
        if (emailIsNotUnique) {
          throw new ValidationException(ValidationExceptionType.DUPLICATED_USER);
        }
        
        user.email = updateUserPartialDTO.email;
      }
      
      if (updateUserPartialDTO.name) {
        user.name = updateUserPartialDTO.name;
      }
      
      if (updateUserPartialDTO.password) {
        user.password = await bcryptjs.hash(
          updateUserPartialDTO.password,
          stringConstants.SALT_ROUNDS,
        );
      }
      
      if (updateUserPartialDTO.fastPassword) {
        if (!/^[a-zA-Z0-9]{4}$/.test(updateUserPartialDTO.fastPassword)) {
          throw new ValidationException(
            ValidationExceptionType.INVALID_FAST_PASSWORD_FORMAT,
          );
        }

        const userSites = await this.userHasSiteRepository.find({
          where: { user: { id: user.id } },
          select: ['site'],
        });
        const userSiteIds = userSites.map((us) => us.site.id);

        const existingUser = await this.userRepository.findOne({
          where: {
            fastPassword: updateUserPartialDTO.fastPassword,
            userHasSites: { site: { id: In(userSiteIds) } },
            id: Not(updateUserPartialDTO.id),
          },
        });

        if (existingUser) {
          throw new ValidationException(ValidationExceptionType.DUPLICATED_USER);
        }

        const oldFastPassword = user.fastPassword;
        user.fastPassword = updateUserPartialDTO.fastPassword;

        if (user.phoneNumber && updateUserPartialDTO.fastPassword && oldFastPassword !== updateUserPartialDTO.fastPassword) {
          await this.sendFastPasswordWhatsAppMessage(user.phoneNumber, updateUserPartialDTO.fastPassword, user.translation);
        }
      }

      user.updatedAt = new Date();

      return await this.userRepository.save(user);
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
      console.log(exception);
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
  
      switch (setAppTokenDTO.osName) {
        case stringConstants.OS_ANDROID:
          user.androidToken = setAppTokenDTO.appToken;
          user.androidVersion = setAppTokenDTO.osVersion;
          break;
        case stringConstants.OS_IOS:
          user.iosToken = setAppTokenDTO.appToken;
          user.iosVersion = setAppTokenDTO.osVersion;
          break;
        case stringConstants.OS_WEB:
          user.webToken = setAppTokenDTO.appToken;
          user.webVersion = setAppTokenDTO.osVersion;
          break;
        default:
          throw new Error('OS no reconocido');
      }
  
      user.updatedAt = new Date();
  
      return await this.userRepository.save(user);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  logout = async (userId: number, osName: string) => {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }
  
      switch (osName) {
        case stringConstants.OS_ANDROID:
          user.androidToken = null;
          break;
        case stringConstants.OS_IOS:
          user.iosToken = null;
          break;
        case stringConstants.OS_WEB:
          user.webToken = null;
          break;
        default:
          throw new Error('OS no reconocido');
      }
  
      user.updatedAt = new Date();
  
      return await this.userRepository.save(user);
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
    const existingUsers = await this.userRepository.find({
      where: {
        email: In(data.map((user) => user.Email.toLowerCase())),
        userHasSites: { site: { id: siteId } },
      },
    });
    return existingUsers;
  };
  getExistingUsersMap = async (data: any): Promise<Map<string, UserEntity>> => {
    const existingUsers = await this.userRepository.find({
      where: {
        email: In(data.map((user) => user.Email.toLowerCase())),
      },
    });

    const userMap = new Map(existingUsers.map((user) => [user.email, user]));
    return userMap;
  };

  saveImportedNewUsers = async (users: CreateUsersDTO[]) => {
    try {
      return await this.userRepository.save(users);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  assignSiteToImportedUsers = async (usersAndSites: UsersAndSitesDTO[]) => {
    try {
      return await this.userHasSiteRepository.save(usersAndSites);
    } catch (exception) {
      HandleException.exception(exception);
    }
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
  findPositionsByUserId = async (userId: number) => {
    try {
      const userPositions = await this.usersPositionsRepository.find({
        where: { user: { id: userId } },
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
        where: { userHasSites: { site: { id: siteId } } },
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
        sites: user.userHasSites.map((userHasSite) => ({
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
        where: { userHasSites: { site: { id: siteId } } },
        relations: { 
          usersPositions: { position: true }
        },
      });

      return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        positions: user.usersPositions.map((userPosition) => ({
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

  findOneByFastPassword = (fastPassword: string, siteId: number) => {
    return this.userRepository.findOne({
      where: { fastPassword, siteId },
      relations: { userHasSites: { site: true } },
    });
  };

  findOneByPhoneNumber = (phoneNumber: string) => {
    return this.userRepository.findOne({
      where: { phoneNumber },
      relations: { userHasSites: { site: true } },
    });
  };

  sendFastPasswordWhatsApp = async (phoneNumber: string, fastPassword: string, language?: string | null): Promise<void> => {
    await this.sendFastPasswordWhatsAppMessage(phoneNumber, fastPassword, language);
  };

  private async validateSiteAccess(siteId: number, userId: number): Promise<void> {
    const authUser = await this.findByIdWithSites(userId);
    if (!authUser || !authUser.userHasSites?.length) {
      throw new UnauthorizedException();
    }

    const hasAccessToSite = authUser.userHasSites.some(userSite => userSite.site.id === siteId);
    if (!hasAccessToSite) {
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
